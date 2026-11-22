# Grill Report — Agentic SDLC design (D10) after losing the frozen scoring round

**Procedure applied:** `skills/grill-me/SKILL.md` (Steps 0–4). **Mode:** conversation mode (no live human; nothing written to the repository). The procedure requires every question to carry a recommendation, so each question below has three parts: the question, the answer the **current design** gives (with a citation) or **NO ANSWER**, and **➡️ Recommended**.
**Inputs read:** `docs/research/scoring/{results.md, methodology.md §3–§4 and §8–§9, audit-log.md, scores/S-A/agentic-sdlc.md, scores/S-C/agentic-sdlc.md}`, benchmark cards (ai-dlc, bmad, superpowers, agile-v, for precedents), `docs/plans/2026-11-20-agentic-sdlc-execution-plan.md` ("plan"), `docs/research/methods/2026-11-20-structure-proposal.md` ("proposal"), and `skills/{agentic-sdlc (SKILL.md and references/*), project-context, brainstorming, grill-me, spec-driven-development, senior-solution-architect, writing-plans, executing-plans}`.
**Notation:** D = design score (reconciled). r = realization factor. RA = D × r. "Anchor" quotes are from methodology §4.

---

## 0. Step 1: the decision tree (what is locked, what is open, and the arithmetic that frames everything)

**Locked:** D10 (7 stages, 4 approvals, 8 agents, 3 paths, standard artifacts; plan §1, §2.2), the frozen methodology (FREEZE.md), and the verdict: **Not superior**. Failed conditions: S1, S2, S3, S4, S5 (results.md).

**Facts that decide the frontier (these are looked up, not asked):**

1. **The S4 failure comes entirely from the realization discount.** At the current D with r = 1, every criterion already meets the benchmark median: C1 3≥3, C5 3≥3, C7 2≥2, C8 2≥2, C11 2≥2, C14 3≥3, C16 2≥2. With r ≤ 0.9, each of these cells falls below the median.
2. **The design-only path to "Superior" is almost closed by construction.** S1 needs T ≥ 68.6 + M ≈ 78. The rubric caps an unbuilt design at r ≤ 0.9, and new integrations get r ≤ 0.8. At r = 0.8 that needs an average D ≈ 4.9, which is essentially 5 everywhere. Worse, most L5 anchors need deterministic tooling, and unbuilt tooling forces r = 0.7 (§8.3). That makes L5 worth only 3.5 RA, which is below "best − 0.25" on any criterion where the best benchmark scores 4 (C2, C5, C6 for S5).
3. **Built at today's D (r = 1.0), the total is 66.6.** That still trails AWS AI-DLC (68.6), so building alone does not win. To clear M, the design needs about +57 weighted points (Σw·D from 333 to ~390), roughly 11.4 points on the 0–100 scale.
4. **r = 1.0 is available now for anything implemented in this repo** (§8.3 row 1). Existing assets that already score at r = 1 include `scripts/validate-skill-content.sh` and the CI behind C13 L5, plus `cli-installer/lib/commands/doctor.js` and the 8 installers. Small scripts written now (a spec linter, a trace checker, a preflight script) would also count at r = 1.

**Open branches (in dependency order):** (A) the gate: what "proof" means before building. (B) Scope: 33 skills, or a minimal method core. (C) Per-criterion target levels and their mechanisms. (D) Contradiction fixes. (E) Vocabulary realignment. A blocks B. B blocks C. D and E are independent of C and can run now.

---

## (a) Criterion-by-criterion grilling

Criteria are ordered as requested: weakest against the benchmarks first. Each table gives the reconciled D, r and RA, the benchmark median and best, the D+1 anchor quote, the blocking questions with the design's answer and a recommendation, contradictions, non-credit language, and a verdict.

### C1 · Ease of adoption — D 3 × r 0.7 = **2.1** (median 3, best 5 BMad) · weight 6

| Item | Content |
|---|---|
| First unmet for D+1 (L4) | "Level 3, plus in-tool guidance that inspects project state and recommends the next step, a troubleshooting or FAQ section, core reading load ≤4k words, and advanced features kept off the first path." |
| At risk at the current level (L3) | "core reading load ≤8k words". Audit #33 proposed 3 → 2 because the guide's size is internally inconsistent. |
| Q1 What exactly must a new user read before the first run, and how many words is it? | **NO ANSWER.** Plan Phase F says the guide is a "one-page guide (readable in under an hour)". One hour at ~200 wpm is about 12k words, which fails L3's 8k. The router alone may be 2–4k words (plan §4.2). The current router SKILL.md is 1,742 words, and its README another 798. ➡️ Recommended: define a **core reading set** of `QUICKSTART.md` (≤1,500 words) + router SKILL.md (≤2,500 words), ≤4k total. Make the guide reference material, not core reading. |
| Q2 What does the router do on an empty repo, a half-done spec, or a merged PR? | **Partial answer.** Prototype Step 0 (`skills/agentic-sdlc/SKILL.md` §Step 0) detects state from `docs/agentic-sdlc/**` and `CHECKPOINTS.md`, and D10 deletes both (plan §1.5). B.1 says "state detection from `specs/` and git" with no rules. ➡️ Recommended: a state table mapping files present to stage, to next skill, to a one-line prompt. Example: `spec.md` without `## Approvals` maps to "Spec approval pending". |
| Q3 Is there a troubleshooting or FAQ section? | **NO ANSWER** (both scorers). ➡️ Recommended: add a 10-item FAQ in the quickstart, covering approval not recorded, no subagents, no branch protection, the loop cap hit, and resume after compaction. |
| Q4 Is there a scripted onboarding check (needed for L5)? | **Partial.** `doctor.js` exists but checks install directories only (S-C C1). ➡️ Recommended: extend `doctor` with an `--agentic-sdlc` check: AGENTS.md block present, DoD present, `specs/` writable, `gh` available, branch protection status. It is already implemented code, so it counts at r = 1.0. Versioned upgrade notes already exist in CHANGELOG.md. |
| Q5 Is 33 skills, 20 in the bundle, 8 agents, 4 human roles and 7 stages learnable by a solo developer, the D11 launch audience? | **NO ANSWER.** D11 targets "developers in general". The Standard path assumes four roles (Product Owner, Tech Lead, Reviewer, Release Owner; plan §1.2), and a solo developer holds all four. ➡️ Recommended: a "solo mode" note: one person, four records, each in a separate turn. Keep agents and specialist skills off the first path. |
| Contradictions | "one-page" vs "readable in under an hour" (plan Phase F, l.298; audit #33). The E.4 clarity test uses "one-page guide + worked example", yet Phase H entry criterion 1 also requires a separate "quickstart" (three documents, ownership unclear). The worked example routes personal data (customer names) to Standard, against §1.4 (see C14). |
| Non-credit language | "readable in under an hour" (vague size); Phase H quickstart (excluded); "Optional (Q7)" for agent generation. |
| Verdict | **Cheapest big win.** With the quickstart ≤1.5k words, the FAQ, a router state table and doctor, L5 is reachable, and doctor/CHANGELOG already exist (r = 1). Gap to best: 2.9 RA × 6 weight. |

### C5 · Code review rigor — D 3 × 0.8 = **2.4** (median 3, best 4) · weight 8

| Item | Content |
|---|---|
| First unmet for D+1 (L4) | "at least two of: (a) parallel lenses or reviewers with a merge and dedup step; (b) verification and triage of each finding (confirmed against the code; fixed, rejected with reason, or deferred); (c) anti-sycophancy rules in both directions (the reviewer must not rubber-stamp, the receiver must not accept findings without checking them); (d) scoped re-review after fixes." |
| Q1 When five lenses run in parallel, who merges duplicate findings and how? | **NO ANSWER.** D.3 says "parallel context-free reviewer prompts" without a merge step (S-A, S-C). ➡️ Recommended: a merge step keyed by `file:line ± 5` plus axis. On a collision, keep the highest severity and list all lenses. Record the result as a single Findings table in the PR. |
| Q2 What happens to each finding? | **Partial.** "Verify-then-verdict triage" is named in D.3. S-A credits it; S-C rejects it as named-only. ➡️ Recommended: every finding gets one of `CONFIRMED-FIXED`, `REJECTED (reason + evidence)` or `DEFERRED (owner, issue link)`. A finding cannot be marked fixed without a `file:line` re-read. |
| Q3 What stops the Implementer from accepting every finding performatively? | **NO ANSWER.** "Receive mode" is named only (D.3). ➡️ Recommended: the receiver must reproduce each finding, or reject it with evidence. Phrases like "You're right!" without a check are a red-flag row. |
| Q4 After a fix, what is re-reviewed: the whole diff or the delta? | **NO ANSWER.** `re-review.md` is named only (C.2). ➡️ Recommended: re-review the fix delta plus the prior findings marked Fixed/Still applies (AI-DLC precedent). Re-review the full diff if the delta exceeds 30% of the original. |
| Q5 Which L5 calibration device applies? | **NO ANSWER.** ➡️ Recommended: default NO-GO plus a required "declined to judge" list (already named in D.3), and a triage log. Together these give two L5 devices without tooling, so r can stay at 0.8–0.9. |
| Contradictions | Prototype `agents.md` "Review Agent … rank across axes" (must not) vs D10 Reviewer. The prototype router runs the security lens only "when sensitive data or Full route" (SKILL.md Step 5), while D.3 lists security as an axis of every review. "Review is not a stage" (§1.1), yet the prototype has an RV stage. |
| Non-credit language | D.3 items listed without behaviour: "weakened-bar guard", "receive mode", "parallel … prompts". |
| Verdict | **Highest leverage in the core.** Specifying (a)–(d) with a triage log and calibration reaches L5 with no tooling. Superpowers precedents: task-reviewer, re-review, receiving-code-review. At r 0.8 that is RA 4.0, which ties the best benchmark and counts toward S5 core. |

### C7 · Graph engineering — D 2 × 0.9 = **1.8** (median 2, best 3; AI-DLC built 3–5) · weight 4

| Item | Content |
|---|---|
| First unmet for D+1 (L3) | "One sub-dimension is *used* and the other at least *declared* … while a code map exists." |
| Q1 Does a code map exist on the Standard path? | **NO.** The dependency map exists only in C.4 `codebase-modernization` (Full/brownfield) (S-A, S-C). ➡️ Recommended: `project-context` writes `docs/CODEMAP.md` (modules, entry points, test commands per module) on first adoption. Writing-plans reads it to fill a `Touches:` field per task. That gives K declared, and K used if it drives the impact list. |
| Q2 Are tasks in `plan.md` or `tasks.md`, and where do the dependency edges live? | **Contradictory.** §1.1 Design writes `tasks.md` with dependencies, but §1.4 Standard says "tasks inside" `plan.md`. The prototype writing-plans optionally writes `tasks/NN-<slug>.md`. ➡️ Recommended: one task-table schema used in both places (`Task | Satisfies | Blocked by | Touches`). `tasks.md` is just the extracted table on Full. |
| Q3 How are parallel results integrated, and what happens on a file conflict? | **NO ANSWER.** C.2 says "parallel only for file-disjoint ready tasks" with no integration step. ➡️ Recommended: merge serially in task-ID order, run the full suite after each merge, and on a conflict stop parallelism for the rest of the frontier. |
| Q4 Is any graph computed (for L5)? | **NO.** ➡️ Recommended: a 100-line dependency-free Node script that parses the task table and reports cycles, the frontier and file overlaps. Built now, it counts at r = 1. |
| Contradictions | tasks.md (§1.1) vs tasks inside plan.md (§1.4). The audit (#40) notes tasks.md with dependencies is Full-only. |
| Verdict | L3 needs only Q1 and Q2 (a cheap code map plus a `Touches` field). L4 needs integration plus impact analysis. A script makes L5 credible at r = 1. |

### C8 · Autonomous execution safety — D 2 × 0.8 = **1.6** (median 2, best 4 AI-DLC) · weight 6

| Item | Content |
|---|---|
| First unmet for D+1 (L3) | "An unattended mode with preflight checks (clean tree, baseline tests), isolation (branch, worktree or sandbox), an explicit list of halt conditions, and resumable state (ledger or checkpoints) that survives interruption or context compaction." |
| Q1 What does preflight check, and what happens when it fails? | **NO ANSWER.** "preflight" is named in B.1 and C.2 only. ➡️ Recommended: `scripts/preflight.sh` checks for a clean tree, a branch that is not main/master, a passing baseline suite (recorded with its SHA), a present and approved `plan.md`, and the `gh` auth state. Any failure means `BLOCKED` with the reason, and no Build starts. |
| Q2 What is the explicit halt list? | **NO ANSWER** (only the 5-round cap and the BLOCKED/NEEDS_CONTEXT statuses). ➡️ Recommended: halt on loop cap; a test deleted or a threshold changed; a file touched outside `Touches:`; a new dependency; a schema or public-API change not in the spec; a secret pattern detected; budget exhausted; 2 consecutive CANNOT_VERIFY results. |
| Q3 Where is the resumable state, and does it survive compaction? | **NO ANSWER in D10.** The progress ledger is named in C.2. The prototype `CHECKPOINTS.md` (deleted by D10) was the old resume source (router Step 0). ➡️ Recommended: `specs/<NNN>/progress.md`, one line per task attempt (`Tn | round | SHA | status | what was tried`). Resume reads it, and it is copied into the PR at the end. The same file also satisfies C6 "state carried". |
| Q4 What budgets apply (L4)? | **NO ANSWER.** ➡️ Recommended: per task, 5 rounds (exists) and 45 minutes wall-clock. Per run, N tasks or a token/cost ceiling set in AGENTS.md. On exhaustion, return `BLOCKED: budget`. |
| Q5 Can a delegated agent push, merge or deploy? Is that enforced by the environment (L5)? | **Partial.** The §1.3 "Never" lists cover the role level only, as prompt rules. ➡️ Recommended: ship platform permission snippets (Claude Code `settings.json` deny `git push`, Copilot tool allow-lists) in `references/permissions.md`, and a pre-push hook template. |
| Contradictions | Rule 9 counts rounds per task, but there is no run-level bound. Prototype `lifecycle.md` says "subagent execution" only on Full, while D10 has no unattended mode on Standard: is C8 evaluated "as offered" or on R's path? |
| Non-credit language | "preflight; resume; worktree/branch isolation" named without rules (C.2, B.1). |
| Verdict | **Largest gap against the best benchmark (2.4 RA).** Answering Q1–Q4 gives L4. A `preflight.sh` built now plus a ledger is r = 1 for the scripted part. Note that the scorers already penalised the inconsistency with C13 resume (audit #48). |

### C11 · Security by default — D 2 × 0.9 = **1.8** (median 2, best 3) · weight 6

| Item | Content |
|---|---|
| First unmet for D+1 (L3) | "On the default path: security considered in spec or design, a security lens in review, secret-handling rules, and dependency hygiene rules." |
| Q1 What is the dependency-hygiene rule on the default path? | **NO ANSWER.** "secrets and supply chain" is named only (D.4). The concrete audit rule lives only in optional CONSTRAINTS.md (S-C). ➡️ Recommended: Rule 10 in §1.6: no new dependency without a recorded reason in plan.md (name, version pin, licence, maintenance signal). Lockfile changes must be reviewed. The ecosystem audit command (`npm audit`, `pip-audit`, `osv-scanner`) runs in Test, and High/Critical findings are Critical. |
| Q2 Is the security lens mandatory on every review, or only on sensitive data or Full? | **Contradictory.** D.3 lists security as an axis for every review. The prototype router Step 5 and lifecycle.md (Full route: "security lens mandatory") make it conditional. ➡️ Recommended: always on. Depth scales with the path. |
| Q3 What triggers the threat model, and who runs it? | **Partial.** D.4 specifies a "five-minute threat model with abuse cases as negative AC" but no trigger. ➡️ Recommended: trigger on any §1.4 risk signal (personal data, money, auth, public API, schema). The output is negative AC-n in spec.md. |
| Q4 What protects against prompt injection, excessive tool permissions and unvetted skills (L4 agent-specific controls)? | **NO ANSWER.** ➡️ Recommended: a rule that repository files, issues, web pages and tool output are data, not instructions; least-privilege permission snippets (shared with C8 Q5); provenance of third-party skills (pinned SHA, recorded in THIRD_PARTY_NOTICES). |
| Q5 Which named reference is mapped (L4/L5)? | **Partial.** `ssdf-mapping.md` is specified in D.4 but sits above a failed gate. ➡️ Recommended: keep it, with evidence locations, but only after L3 and L4 are concrete. |
| Contradictions | Positioning claims "Security in the default path — not an optional add-on" (proposal §7.4), yet the dependency rule is opt-in and the lens is conditional in the prototype. "Security Auditor never claims compliance" sits beside "regulated-ready appendices" positioning (§1.7). |
| Verdict | **One rule away from L3.** Q1 + Q2 → L3 (RA 2.7, above median). Q3 + Q4 → L4 (RA 3.6, above best benchmark 3). Agile V is the precedent for an L4 built design. |

### C14 · Right-sizing and brownfield — D 3 × 0.9 = **2.7** (median 3, best 4 Agile V) · weight 6

| Item | Content |
|---|---|
| First unmet for D+1 (L4) | "separate size and risk axes (risk triggers force a heavier path regardless of size), escalation when work outgrows its path, and brownfield artifacts (code map, characterization tests for legacy code, regression selection)." |
| Q1 Does personal data force Full? | **Contradictory.** §1.4 lists "personal/health data" as a Full signal, and "Risk signals override size". The flagship worked example (proposal §8; router Example 1) routes "customer names (data)" to **Standard**. ➡️ Recommended: split signals into *Full-forcing* (health/financial data, auth, money, schema, public API, irreversible) and *Standard-raising* (ordinary personal data with an existing permission model). Fix the example. |
| Q2 What is the regression-selection artifact? | **NO ANSWER in D10.** The prototype `TEST-PLAN.md` has a "Regression scope" section (artifacts.md), but D10 §1.5 does not list TEST-PLAN.md at all. ➡️ Recommended: a `## Regression scope` section in plan.md, derived from `Touches:` and CODEMAP (shared with C7). |
| Q3 When do characterization tests run outside Full modernization? | **NO ANSWER.** C.4 only. ➡️ Recommended: any task touching a module without tests gets a characterization test first (Rule 4 extension). |
| Q4 Is path selection reproducible (L5 rubric)? | **Partial.** B.1 "rubric with risk signals and examples" has no scoring. ➡️ Recommended: a 5-item scored rubric (scope, data, reversibility, interface, familiarity, each 0–2). Over 6 or any Full-forcing signal means Full. Add 6 worked cases. |
| Contradictions | Quick path "trivially reversible" vs "+ Release if production deploys": when does Quick not deploy? Standard says "Spec + Plan may be one review", yet records live in two files. |
| Verdict | Q1–Q3 → L4 (RA 3.6 at 0.9, which beats AI-DLC and BMad and ties Agile V). |

### C16 · Learning loop — D 2 × 0.8 = **1.6** (median 2, best 3) · weight 4

| Item | Content |
|---|---|
| First unmet for D+1 (L3) | "A retrospective in the default cycle producing owned action items that change the environment (instruction files, checklists, skills, tests)." |
| Q1 Is the retrospective required on Standard? | **Contradictory.** §1.1 Operate includes "retrospective". §1.4 lists it as a required artifact only on Full. The prototype router says "mandatory on Full, optional on Standard". The worked example (proposal §8) shows a retro on a Standard item. Audit #52 upheld r 0.8 because of this. ➡️ Recommended: **required on Standard and Full**. On Standard it is a 5-line micro-retro (one keep, one change, one environment action with an owner and a target file) appended to the PR or spec.md. |
| Q2 How are action items followed up? | **NO ANSWER.** ➡️ Recommended: the next item's Plan stage reads open retro actions. An action open for two cycles escalates to the Tech Lead. |
| Q3 Which outcome metrics are collected each cycle, from what data? | **NO ANSWER.** DORA is named only (D.7). ➡️ Recommended: from git/`gh` only: lead time (first commit to merge), change-failure rate (reverts or hotfixes within 7 days), rework rate (fix rounds per task from progress.md). A script writes `metrics.md`. Decision rule: two cycles over threshold means a process change item. |
| Q4 Recurrence: when does a repeated failure become a check? | **Partial.** D.8 says "mechanical → check, judgment → AGENTS.md", with no recurrence count. ➡️ Recommended: the second occurrence of the same failure class becomes a check or test. |
| Verdict | Q1 alone gives L3 (RA 2.4 at 0.8). Q2–Q4 give L4. A metrics script built now makes L5 plausible. |

### C6 · Loop engineering — D 3 × 0.8 = **2.4** (median 2, best 4) · weight 7

| Item | Content |
|---|---|
| First unmet for D+1 (L4) | "loopback routing by root cause …, state carried between iterations (what was tried), scoped re-check after a fix, and an anti-thrash rule." |
| Q1 Is a debugging attempt also a fix round? | **NO ANSWER.** Rule 9 allows 5 rounds per task; C.3 escalates after 3 failed fixes. Nested, these could allow 15 attempts, or 3. ➡️ Recommended: one counter. Each fix attempt is a round. At 3 failed fixes on the same symptom, escalate as a design question; the hard cap is 5. |
| Q2 Where is "what was tried" recorded? | **NO ANSWER.** The ledger is named only. ➡️ Recommended: progress.md (C8 Q3). Each round must read it and must not repeat a recorded hypothesis. |
| Q3 Who is the escalation target of the debugging loop? | **NO ANSWER** (S-C "borderline"; audit #39). ➡️ Recommended: the Tech Lead (plan-level) or the Product Owner (spec-level), chosen by root-cause routing. |
| Q4 Is the "fresh, more capable agent from round 4" available on all 8 platforms? | **NO ANSWER.** Prototype lifecycle.md. ➡️ Recommended: where no stronger model exists, round 4 starts a fresh context with the ledger only. |
| Verdict | Q1–Q3 give L4 (RA 3.2 at 0.8; with a specified efficacy eval, D 5 × 0.8 = 4.0). |

### C3 · Code quality — D 4 × 0.8 = **3.2** (median 3, best 5) · weight 9

| Item | Content |
|---|---|
| First unmet for D+1 (L5) | "mechanized quality: scripts, hooks or CI that run linters, type checks, coverage or mutation testing as gates, *or* evals or pressure tests showing that the practice instructions change agent behaviour." |
| Q1 Is CONSTRAINTS.md (with gates) default or optional? | **Optional** ("Full path or teams that want it", §1.5, l.92). ➡️ Recommended: a minimal floor in the AGENTS.md DoD on every path (lint, typecheck, tests pass, no new suppressions). The full CONSTRAINTS stays optional. |
| Q2 What is the eval pass threshold? | **NO ANSWER** (§4.7: ≥3 scenarios, 4–6 expectations, no threshold). ➡️ Recommended: with-skill pass rate ≥ 80% and ≥ +30 points over no-skill baseline on the pressure scenario. Run it with skill-creator, and record the results in-repo so the measurement is actually taken. |
| Q3 What are the mocking rules? | **NO ANSWER** ("mocking guidance" is named only). ➡️ Recommended: mock only at process boundaries (network, clock, randomness, filesystem outside the temp dir); never mock the unit under test. |
| Verdict | Already strong. L5 needs the floor on the default path, plus evals with a threshold. Evals run in this repo count at r = 1. |

### C4 · Verification and evidence — D 4 × 0.8 = **3.2** (median 3, best 5) · weight 9

| Item | Content |
|---|---|
| First unmet for D+1 (L5) | "persisted evidence records bound to a version (commit SHA or hash) with a staleness rule (re-run when stale or unknown), *or* a deterministic gate (script or CI) that refuses completion without passing evidence." |
| Q1 Is evidence bound to the turn or to the commit? | **Contradictory.** Rule 2 says "fresh command output in the same turn". D.2 says "evidence bound to the commit" (named only, no SHA field). ➡️ Recommended: the PR Verification table gets a `SHA` column. Evidence whose SHA ≠ HEAD is stale and must be re-run before PR approval. |
| Q2 Where does the test design output live? | **NO ANSWER.** D.1 test-strategy has no artifact, because D10 dropped TEST-PLAN.md from §1.5. ➡️ Recommended: a `## Test design` section in plan.md, written by the Test Engineer before Build. |
| Q3 Is the required CI check enforced? | **"where possible"** (§1.2). ➡️ Recommended: a check script `verify-evidence` that fails if any AC-n row lacks a SHA = HEAD with PASS. It runs locally on every platform and in CI where available. |
| Contradictions | The prototype lifecycle.md makes "independent test design" Full-only, while D10 §1.3 and Rule 5 make it universal. |
| Verdict | One field plus one script gives L5. The script built now counts at r = 1. |

### C12 · Release and operations — D 3 × 0.7 = **2.1** (median 1, best 3) · weight 6

| Item | Content |
|---|---|
| First unmet for D+1 (L4) | "an incident procedure (triage, postmortem), a defined intake from production signals into the backlog or spec, and go/no-go release criteria tied to the spec." |
| At risk at the current level (L3) | "observability requirements (logs, metrics, alerts) defined before release". Audit #46 proposed 3 → 2. |
| Q1 Where are logs, metrics and alerts specified before Release approval? | **NO ANSWER.** The spec "indicator" is a business metric. SLOs and alerts are D.7 (Operate, after release). ➡️ Recommended: a spec.md `## Observability` section (log events, one metric per AC-n where meaningful, one alert with a threshold). Release approval is blocked if it is empty. |
| Q2 What are the go/no-go criteria? | **NO ANSWER.** D.5 "advance/hold/roll back thresholds" have no values. ➡️ Recommended defaults: advance if error rate ≤ baseline + 0.5 pp and p95 latency ≤ baseline + 10% over the watch window; roll back otherwise. Every AC-n must have PASS evidence. |
| Q3 What is the incident procedure? | **NO ANSWER** ("roles, severity" named). ➡️ Recommended: SEV1–3 definitions, the first 3 actions, a postmortem template within 5 business days, and action items → issue-triage. |
| Q4 Is the runbook required on Standard? | **Contradictory.** §1.1 Release lists a "runbook" for every release; §1.4 requires it only on Full. ➡️ Recommended: Standard gets a 5-line rollback runbook inside the release notes. |
| Scope-load warning | C12 is already penalised −0.1 (17 mechanisms vs ~13 in the largest benchmark; S-C). Adding more lowers it further. ➡️ Recommended: **cut** D.7 to SLO-from-indicator, an incident procedure, a postmortem and intake. Drop on-call ownership, DORA from this criterion (it is C16) and environment approvals beyond Release. |
| Verdict | Q1–Q3 with fewer mechanisms gives L4 at r 0.8 (RA 3.2, above best 3). |

### C2 · Requirements and specification — D 4 × 0.8 = **3.2** (median 3, best 4) · weight 8

| Item | Content |
|---|---|
| First unmet for D+1 (L5) | "deterministic validation of the spec (a script or schema checks that acceptance criteria and IDs are present and flags vague terms), or acceptance criteria made executable, and a rule that a post-approval change re-opens approval or revalidation." |
| Q1 Where does the re-approval record go now that CHECKPOINTS.md is deleted? | **NO ANSWER in D10.** The change protocol (rules.md step 5) still writes to CHECKPOINTS.md (audit #34). ➡️ Recommended: spec.md `## Approvals` gets one row per revision, and a revision bump invalidates the earlier rows. |
| Q2 Is there a spec linter? | **NO** ("scripts … optional", §4.2). ➡️ Recommended: `scripts/spec-lint` checks required sections, the `AC-n` regex, Given/When/Then shape, a vague-word list ("fast", "user-friendly", "etc.", "as needed") and an empty Open questions section. Built now, it counts at r = 1, which gives L5. |
| Q3 Spec + Plan "may be one review": is the plan reviewed against a frozen spec? | **NO ANSWER.** ➡️ Recommended: a combined review is allowed, but the record states both revisions, and the spec is frozen first in the same record. |
| Verdict | One script gives L5 (r 1 for the script; the rest at 0.8). |

### C9 · Traceability — D 4 × 0.7 = **2.8** (median 2, best 3; design leads) · weight 5

| Item | Content |
|---|---|
| First unmet for D+1 (L5) | "machine-checked trace (a tool validates links or generates the matrix) and links extended to production (deployment, monitoring or incident records referencing requirement IDs)." |
| Q1 Who checks that every AC-n has a task, a commit, a test and evidence? | Prompts only (D.2, B.8). ➡️ Recommended: `scripts/trace-check` greps spec, plan, `git log` `[Tn, AC-n]` and the PR table, and prints the matrix and orphans. It shares a parser with verify-evidence. |
| Q2 Is the indicator per AC or per change? | **Per change** (S-C). ➡️ Recommended: the spec's Observability metrics are tagged with AC-n (C12 Q1). |
| Verdict | r 0.7 is the penalty for four or more unbuilt cross-stage dependencies. Building the chain end to end in one vertical slice removes it. |

### C10 · Human governance — D 4 × 0.8 = **3.2** (median 2, best 4) · weight 6

| Item | Content |
|---|---|
| First unmet for D+1 (L5) | "enforcement beyond prompts (branch protection, required reviewers, CI checks of approval records, or signed approvals) and an audit trail that can be exported or is mapped to a named standard." |
| Q1 What happens when "where possible" is not possible (non-GitHub host, no admin rights, local-only)? | **NO ANSWER** (§1.2; Rule 3). ➡️ Recommended: an approval-record check script (row present, role, exact words, revision = current) run by preflight before Build and by CI before merge. Branch protection is an add-on, not the mechanism. |
| Q2 Who enforces Spec and Plan approvals? | **Nobody beyond the prompt.** ➡️ Recommended: preflight refuses Build without a matching approval row (same script). |
| Contradictions | The positioning says "Enforced approvals" (§1.7; proposal §7.5), but the table header says "Enforced by (where possible)" and Spec/Plan approvals have "—". |
| Verdict | One script gives L5 and also lifts C8 and C4. |

### C13 · Context engineering — D 5 × 0.8 = **4.0** (median 4, best 5)

| Item | Content |
|---|---|
| Status | At the top level. r was cut to 0.8 because resume is named only (audit #48). |
| Q1 Does phase-boundaries survive the vocabulary rewrite? | It uses PL/AN/…/CHECKPOINTS (prototype). ➡️ Recommended: rewrite it in Phase 0 and make progress.md the resume source. |
| Verdict | Protect it. Do not let the 20-skill depth standard (2–4k words each) break the role-scoped reads. |

### C15 · Portability — D 4 × 0.9 = **3.6** (median 3, best 5)

| Item | Content |
|---|---|
| First unmet for D+1 (L5) | "automated validation of skills and extensions in CI … and a versioned extension interface." |
| Q1 What is the extension interface? | **NO ANSWER.** ➡️ Recommended: a versioned `agentic-sdlc/references/extension-interface.md` (v1) listing the required frontmatter, stage tag, status vocabulary and artifact contracts, plus CI checks of those fields. |
| Hidden portability defect | `skills/executing-plans/SKILL.md` requires `superpowers:using-git-worktrees` and `superpowers:finishing-a-development-branch`, which are **not in this repo**. It is a hard dependency on another plugin. |
| Verdict | Cheap L5. Fix the external dependency in Phase 0. |

---

## (b) Ranked top-15 decisions for the owner/architect

Ranked by frontier order first (a decision that unblocks others goes earlier), then by weighted points recovered.

| # | Decision (yes = accept the recommendation) | Recommended answer | Unblocks / impact |
|---|---|---|---|
| 1 | **Gate.** Replace "prove Superior on a design before building" with "build a minimal vertical slice, then re-score as implemented (§8.5) with fresh scorers"? | **Yes.** On a design, S1 needs D ≈ 5 everywhere, and L5 tooling caps r at 0.7, so the gate as written is effectively unpassable. Keep the frozen methodology for any public claim; decouple the *build decision* from the *superiority claim*. Pre-register the re-score now. | Everything |
| 2 | **Scope.** Cut v3.0.0 from 33 skills / 20-skill bundle to a **method core of ≤10 skills** (router, project-context, spec-driven-development, writing-plans, executing-plans, test-driven-development, verification-gate, multi-axis-code-review, security-hardening, shipping-and-release), with the rest in a later release? | **Yes.** It reduces scope-load penalties, the C1 reading load and the realization risk. Precedent: BMad reaches C1 5 with ~3k core words. | C1, r on all |
| 3 | **Five lifts.** Target C5 → 5, C8 → 4, C11 → 4, C1 → 5 and C6 → 4 first? | **Yes.** Built, that is +59 weighted points, Σw·D 333 → ~392 (≈78.4), which clears 68.6 + M. It also fixes S4 and puts C2, C5 and C6 at best for S5. | S1, S4, S5 |
| 4 | **Build 5 tiny dependency-free scripts now**: `spec-lint`, `trace-check`, `verify-evidence`, `approval-check`, `preflight`? | **Yes.** Each counts at r = 1.0 and reaches L5 in C2, C9 (half), C4, C10, plus L3 for C8. Fewer than 1,000 lines of POSIX shell or Node in total. | C2, C4, C8, C9, C10 |
| 5 | **Retrospective required on Standard** (5-line micro-retro with an owned environment action)? | **Yes.** It resolves the §1.1 vs §1.4 contradiction and gives C16 L3. | C16 |
| 6 | **Dependency-hygiene rule as §1.6 Rule 10**, and the security lens on every review? | **Yes.** C11 2 → 3 with one rule. Add the prompt-injection, least-privilege and provenance rules for 4. | C11 |
| 7 | **Single progress ledger** `specs/<NNN>/progress.md` as the source for resume, carried state and metrics? | **Yes.** One artifact serves C6 L4, C8 L3, C13 r and C16 rework. | C6, C8, C13, C16 |
| 8 | **Specify review (a)–(d)** with merge/dedup, triage dispositions, receive-side verification, delta re-review, default NO-GO and a triage log? | **Yes.** C5 L5 with prompts only. Superpowers and AI-DLC are precedents. | C5 |
| 9 | **One fix-loop counter** (3 failed fixes on a symptom → design question; hard cap 5; named escalation by root cause)? | **Yes.** It removes the Rule 9 / C.3 ambiguity. | C6 |
| 10 | **Core reading set ≤4k words** (QUICKSTART ≤1.5k + router ≤2.5k); the guide becomes reference; FAQ; extend `doctor`? | **Yes.** It resolves "one page" vs "under an hour". C1 → 5 (doctor and CHANGELOG exist). | C1 |
| 11 | **Fix risk routing:** split signals into Full-forcing and Standard-raising, and correct the CSV worked example? | **Yes.** The flagship example currently violates "Risk signals override size". | C14, credibility |
| 12 | **CODEMAP.md from project-context plus `Touches:` per task**, regression scope in plan.md, characterization-first on untested modules? | **Yes.** C7 → 3 and C14 → 4 with shared artifacts. | C7, C14 |
| 13 | **Observability section in spec.md and numeric go/no-go defaults**; cut the D.7 mechanism list to avoid the scope-load penalty? | **Yes.** It secures C12 L3 against the adjudicator risk and reaches L4. | C12 |
| 14 | **Evidence bound to SHA**, with a staleness rule replacing "same turn"? | **Yes.** C4 L5, and it removes the turn-vs-commit contradiction. | C4 |
| 15 | **Phase 0 vocabulary purge** extended to executing-plans (external `superpowers:*` dependencies), grill-me ("Analyze stage"), and a versioned extension interface? | **Yes.** It removes the superseded vocabulary that scorers discount, and gives C15 → 5. | C15, r |

**Per-mechanism scope cap (applies to every decision above):** commit no more new mechanisms per criterion than the largest benchmark implements there (§8.3 scope load). C12 is already over the cap. C5 (D.3 lists 8 items) and C11 (D.4 lists 6) are near it.

---

## (c) Contradictions to resolve

| # | Contradiction | Where | Criterion hit | Resolution |
|---|---|---|---|---|
| 1 | Guide is "one-page" yet "readable in under an hour" (~12k words) | plan Phase F l.298; audit #33 | C1 (3 → 2 risk) | Core set ≤4k; guide as reference |
| 2 | Retrospective in every Operate vs required only on Full; router "optional on Standard"; worked example shows a Standard retro | plan §1.1 vs §1.4; router Step 7; proposal §8 | C16 | Required on Standard (micro-retro) |
| 3 | Runbook in every Release vs Full-only | plan §1.1 vs §1.4 | C12 | 5-line runbook in release notes on Standard |
| 4 | Personal data forces Full, yet the worked example routes "customer names" to Standard | plan §1.4 vs proposal §8, router Example 1 | C14, C11 | Two signal tiers; fix example |
| 5 | Proposal says 3 agent responsibilities, "no relay of one agent per stage"; plan has 8 agents; prototype has 8 *different* names (Triage, Analyst, Coding, QA…) | proposal §4, §9 Q3 vs plan §1.3 vs `references/agents.md` | C13, C1 | Keep 3 core agents plus specialists as skills; delete the prototype names |
| 6 | Tasks in `tasks.md` (Design) vs "tasks inside plan.md" (Standard) | plan §1.1 vs §1.4/§1.5 | C7 | One task-table schema |
| 7 | "Enforced approvals" positioning vs "Enforced by (where possible)" and no enforcement for Spec/Plan | plan §1.7, proposal §7.5 vs §1.2, Rule 3 | C10, C4 | approval-check script |
| 8 | Evidence "fresh … in the same turn" vs "bound to the commit" | Rule 2 vs D.2 | C4 | SHA + staleness |
| 9 | Fix loop 5 rounds vs debugging escalation after 3 failed fixes, no shared counter | Rule 9 vs C.3 | C6 | One counter |
| 10 | Change protocol records re-approval in CHECKPOINTS.md, which D10 deletes | rules.md change protocol vs plan §1.5 | C2, C10 | Revision rows in `## Approvals` |
| 11 | TEST-PLAN.md and HANDOVER.md exist in prototype templates and agents.md but not in D10 §1.5; test-strategy has no output artifact | artifacts.md, agents.md vs §1.5, D.1 | C4, C14 | `## Test design` and `## Regression scope` in plan.md |
| 12 | Security lens on every review (D.3 axes) vs only "sensitive data or Full" | D.3 vs router Step 5, lifecycle.md Full row | C11, C5 | Always on |
| 13 | Independent test design universal (Rule 5, §1.3) vs Full-only | §1.3 vs lifecycle.md Routes | C4 | Universal; inline fallback labelled |
| 14 | "Review is not a stage" vs prototype RV stage and CP4 | §1.1 vs router, lifecycle.md | vocabulary | Phase 0 rewrite |
| 15 | "15 new + 6 upgraded" vs "12 new skills" vs 33 = 21 + 12; baseline (main vs branch) never stated | plan §9 vs §2.4 vs §3 | C1 scope | State the baseline; re-count after decision 2 |
| 16 | Spec + Plan "may be one review", but plan approval must follow a frozen spec | §1.4 Standard | C2, C10 | Single record naming both revisions, spec frozen first |
| 17 | Indicator traced "to production" per requirement (Rule 8) vs indicator per change | Rule 8 vs §1.5 | C9 | AC-tagged observability metrics |
| 18 | `executing-plans` requires `superpowers:*` skills not shipped here | executing-plans §Integration, §Step 5 | C15, C8 | Replace with in-repo procedures |
| 19 | Six existing skills still use PL/AN/DE, CP1–CP5, `docs/agentic-sdlc/`, SPEC/PLAN uppercase; grill-me's description says "Analyze stage", which D10 renamed to Specify | grep: router 34 hits, lifecycle 34, artifacts 24, spec-driven-development 13, writing-plans 11, senior-solution-architect 5, brainstorming 4, grill-me 2, project-context 2 | all r | Phase 0 (task 0.6), with grill-me and executing-plans included |
| 20 | Phase B–D content is "Minimum additions (refine from the matrix)", so the behaviour of most L4 mechanisms is deferred to a matrix that does not exist yet | plan §5 Phase B–D headers | C5, C6, C8, C11, C12 | Write behaviour, with numbers, in the plan before re-scoring |

---

## Cross-cutting grill

**Is 33 skills too big to adopt?** The design gives no answer. Rough numbers: 20 bundle skills at 2–4k words each is a 40–80k-word corpus, plus 8 agent files, 4 human roles, 7 stages, 3 paths and 5 statuses. The scorers did not penalise C1 for this, because C1 measures core reading. It does show up in r ("largest single dependency for every criterion", S-A Realization risks) and in the scope-load rule. ➡️ Recommended: a ≤10-skill core (decision 2). Ship specialist skills as an add-on bundle.

**Scope-load penalty risk.** The −0.1 is already applied in C12. The next candidates are C5 (8 named D.3 items against Superpowers' ~6) and C11 (D.4 plus the SSDF mapping plus AI guardrails against Agile V). ➡️ Recommended: per criterion, list the mechanisms required for the *target* anchor and nothing more. Park the rest in a "later" list that is not part of the design being scored.

**Superseded vocabulary.** See contradiction #19. The scorers kept prototype credit only where D10 retains the mechanism (audit l.54). Every un-rewritten prototype keeps r below 1 even after "building". ➡️ Recommended: Phase 0 first, with a grep-zero acceptance check (plan task 0.6 already defines one; add grill-me and executing-plans to it).

**What an honest builder needs decided before implementing:** (1) the gate and re-score protocol (#1); (2) the core skill list (#2); (3) target level per criterion, with mechanism counts ≤ the benchmark maximum; (4) the five scripts and their CLI contracts (inputs, exit codes 0/1/2); (5) the artifact schema: `spec.md` sections incl. Approvals, Observability, Open questions; `plan.md` task table incl. `Touches`, Test design, Regression scope; `progress.md` line format; the PR Verification table incl. SHA; (6) the halt list and budgets; (7) the solo-developer role-collapse rule; (8) the fallback when the host has no branch protection or subagents; (9) eval pass thresholds; (10) who signs off the re-score, and when.

---

## Step 4: closing summary

- **Decisions confirmed:** none. The design owner was not present; all 15 decisions in (b) are recommendations awaiting the owner.
- **Open questions:**
  - Owner: decisions #1 and #2.
  - Architect: decisions #3–#15.
  - Methodology owner: confirm that §8.5 re-scoring of a partial build is admissible.
- **Risks surfaced:**
  - Goal-post moving if the gate is changed after the verdict. Mitigate by pre-registering the re-score.
  - Scope creep re-triggering scope-load penalties.
  - Prototype credit evaporating during the Phase 0 rewrite.
  - Platform enforcement unavailable on 6 of 8 hosts.
- **Candidate acceptance criteria for the revised plan:**
  - AC-1: Given a fresh user, when they read QUICKSTART + router, then the word count is ≤4,000 and `doctor --agentic-sdlc` exits 0 on a sample repo.
  - AC-2: Given a spec missing AC IDs or containing a listed vague term, when `spec-lint` runs, then it exits 1 naming the line.
  - AC-3: Given a PR Verification row whose SHA ≠ HEAD, when `verify-evidence` runs, then it exits 1.
  - AC-4: Given no approval row for the current plan revision, when `preflight` runs, then Build does not start and the status is `BLOCKED`.
  - AC-5: Given a Standard item reaching Operate, then a micro-retro with ≥1 owned environment action exists before the item closes.
  - AC-6: Given a review with parallel lenses, then the PR holds one merged Findings table where every finding has a disposition.
  - AC-7: `grep -rE "CP[0-9]|CHECKPOINTS|docs/agentic-sdlc|superpowers:" skills/` returns nothing.
- **Docs written:** this report only (session workspace). No repository file was modified.
