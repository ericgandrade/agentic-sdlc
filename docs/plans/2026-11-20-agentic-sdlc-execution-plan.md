# Agentic SDLC — Execution Plan (D10)

> 🛑 **GATE — read before executing anything below (2026-11-22).** Do **not** start Phase 0 or any skill rewrite yet. The owner requires proof, before the large build effort, that this method is superior to the benchmark methods. The scoring round is in progress: see `docs/research/scoring/HANDOFF.md` (state, remaining cards, how to continue) and `docs/research/scoring/orchestrator-log.md`. Phase 0 may start only after `docs/research/scoring/results.md` exists **and** the owner has reviewed the verdict; if the verdict is not "Superior", the plan must be changed first. The kick-off prompt in §10 starts Phase 0 and must **not** be used until the gate is lifted.

> ✅ **Gate note (2026-11-22).** The owner approved execution of `docs/plans/2026-11-22-agentic-sdlc-score-gap-closure.md`, which is now executing. Its Batch 0 performs Phase 0 tasks 0.1–0.5 and amends this plan with the contradiction resolutions K1–K12 from `docs/research/gap-closure/architect-report.md` §3. Mechanism IDs written as `M n.m` below refer to that report's §2. Architecture decision (report §0, option B): mechanisms are built first as stage modules inside `skills/agentic-sdlc/` (`references/`, `templates/`, `agents/`, `scripts/`, `examples/`); Phases C and D later promote a module to its own skill as a pure move (for example `references/tdd.md` → `test-driven-development/`).

> **For the executing agent (Codex, Claude Code or any other):** this document is self-contained and is the **single source of truth for execution** from 2026-11-20. Read it fully, then the files in §2.3, before touching anything. Execute task by task with the `executing-plans` discipline: one task at a time, verify, commit, move on. **Stop at every Checkpoint and wait for the owner.**
>
> **Supersedes** the structure and execution order of `docs/plans/2026-11-18-agentic-sdlc.md` (master plan, V-shaped design) and `docs/plans/2026-11-19-agentic-sdlc-depth-pass.md` (8-stage cycle). Those remain for history; the depth standard and license rules from them are restated here.

**Goal:** Turn claude-superskills into the home of the **Agentic SDLC** — a method that follows the standard software development life cycle with AI agents: seven standard stages, four named human sign-offs, eight agents named by function, three paths sized by risk, and standard artifacts — built at real depth from the five reference frameworks, released as v3.0.0 with 33 skills.

**Evidence:** every structural choice below comes from `docs/research/methods/2026-11-20-structure-proposal.md`, which synthesizes broad research on ~25 methods (classic and standards, agile/flow/DevOps, AI-native) plus deep inventories of Superpowers, Matt Pocock, Addy Osmani, BMad and Agile V (concepts only).

---

## 1. The method (decision D10 — approved by the owner on 2026-11-20)

### 1.1 Seven standard stages

**Discover → Specify → Design → Build → Test → Release → Operate**, iterated per work item; Operate feeds Discover.

| Stage | What happens | Lead agent | Helpers |
|---|---|---|---|
| **Discover** | Take in the request; check duplicates and prior rejections; classify (bug, task, story, epic); size and choose the path; set the goal and the indicator to measure | Planner | — |
| **Specify** | Write `spec.md`: user stories, acceptance criteria (Given/When/Then), non-goals, constraints, security notes, indicator, and §Release & observability (signal, numeric alert threshold, dashboard, owner, rollout, rollback command — required by `spec-lint`, M 12.1) | Planner | Security Auditor |
| **Design** | ADRs for real decisions; `plan.md` with approach and the `## Tasks` table (thin vertical slices with dependencies, M 7.1) — tasks live in `plan.md` on every path | Planner | Architect |
| **Build** | Implement task by task, test-first, small commits, open the pull request; debug systematically | Implementer | — |
| **Test** | Verify against the spec in a fresh context: acceptance tests, independent code review, security review; evidence in the PR | Reviewer | Test Engineer, Security Auditor |
| **Release** | Deploy behind feature flags, staged rollout, rehearsed rollback, test alert fired in staging, release notes; runbook whenever the change alters operated behaviour (new endpoint, job, config or alert) | Release Engineer | — |
| **Operate** | Monitor the change against the alerts and indicator defined in Specify (Operate monitors; it does not define), handle incidents, postmortems, retrospective on every path (M 16.1); new work returns to Discover | SRE | — |

- **Review is not a stage**: independent review happens in Test and ends in the Test sign-off.
- **Unit tests live in Build** (TDD); **Test** is verification against the spec (Continuous Delivery commit stage vs acceptance stage).
- "Specify" = requirements specification (standards vocabulary) written as `spec.md` (AI-native vocabulary).

### 1.2 Four human sign-offs (+ intake decision)

| Sign-off | When | Default role | Recorded in | Enforced by (M 10.4, M 10.5) |
|---|---|---|---|---|
| Intake decision — required when Discover finds a duplicate or a prior rejection; otherwise recorded as `n/a — <reason>` | End of Discover | Product Owner | Issue / spec.md header | `spec-lint` (intake line present) |
| **Specify sign-off** | End of Specify | Product Owner | `spec.md` → `## Approvals` | `approval-check` required CI check: rev + 12-hex hash match, approver ≠ author |
| **Design sign-off** | End of Design, before code | Tech Lead | `plan.md` → `## Approvals` | `approval-check` required CI check: rev + 12-hex hash match, approver ≠ author |
| **Test sign-off** | End of Test | Human reviewer (engineer) | Pull request review | Branch protection, CODEOWNERS required reviewers, required CI checks |
| **Release sign-off** | Before production | Release Owner | Release notes | Deployment environment required reviewers |

- Each record states: sign-off, revision, 12-hex hash of the file body without `## Approvals`, date, role, person, exact words, evidence reviewed, residual risks accepted, decision. Any edit changes the hash and voids the approval.
- Failure behaviour: when the host offers none of the platform controls above, the PR body carries the banner `enforcement: prompt-only` and the doctor reports WARN; the approvals still apply.
- The agent **ends its turn** after producing an artifact that needs approval; only an explicit "yes" in a later turn counts. "Sounds good" about something else, silence or "whatever you think" is not approval.
- One person can hold several roles; the record names the role exercised. Approver ≠ PR author is enforced by `approval-check` (M 10.4); in a one-person team the waiver procedure applies (owner, reason, expiry ≤ 30 days, follow-up issue — M 10.3).

### 1.3 Eight agents, named by function (option C)

Defined in `skills/agentic-sdlc/agents/<name>.md` (M 13.1); each file states what the agent reads and never sees, which skills it uses, what it may do and never does, its tool allow list (M 11.5), its authority limits (M 8.6) and what it returns.

| Agent | File | Kind | Stages | Never |
|---|---|---|---|---|
| **Planner** | `planner.md` | Core | Discover, Specify, Design | Writes production code |
| **Implementer** | `implementer.md` | Core | Build | Verifies or approves its own work; weakens tests |
| **Reviewer** | `reviewer.md` | Core (independent, read-only) | Test | Fixes code; trusts the PR description |
| **Architect** | `architect.md` | Specialist (called by Planner) | Design | Adds scope not in the spec |
| **Test Engineer** | `test-engineer.md` | Specialist (called by Reviewer) | Test | Designs tests from the implementation instead of the spec |
| **Security Auditor** | `security-auditor.md` | Specialist (Planner, Reviewer) | Specify, Test | Claims compliance |
| **Release Engineer** | `release-engineer.md` | Specialist | Release | Deploys to production without Release sign-off |
| **SRE** | `sre.md` | Specialist | Operate | Takes destructive production actions without the on-call engineer |

Shared report status vocabulary: `DONE` · `DONE_WITH_CONCERNS` · `BLOCKED` · `NEEDS_CONTEXT` · `CANNOT_VERIFY`. Shared severity scale: **Critical** (blocks Test/Release sign-off) · **Important** (fix or accept as residual risk) · **Minor** (deferred list).

No subagent on the platform → a separate labeled pass; the label `self-review` is mandatory in the PR for every check of the author's own work.

### 1.4 Three paths sized by a scored rubric

| Path | Typical work item | Score (M 14.2) | Approvals | Required artifacts |
|---|---|---|---|---|
| **Quick** | Bug, task | S ≤ 4 and R = 0 | Test (+ Release when production deploys) | Issue with acceptance test, PR with evidence, retro record (batched: every 10 items or 14 days) |
| **Standard** | Story, feature | S 5–6 or R = 1 | Specify, Design, Test, Release (one combined Specify + Design review when the plan has ≤ 5 tasks; otherwise two) | `spec.md`, `plan.md` (tasks inside), `acceptance-tests.md`, PR, release notes, retro record (≤ 15 min, within 5 business days) |
| **Full** | Epic, high-risk or regulated change, brownfield modernization | S ≥ 7, R ≥ 2, personal/health data or irreversible | All four, separately + second human reviewer on the Test sign-off (PR) | `spec.md`, `plan.md` (tasks inside), `acceptance-tests.md`, ADRs, threat model, `CONSTRAINTS.md`, release plan, runbook, full retrospective |

Size S = files (≤ 3: 1 · 4–15: 2 · > 15: 3) + components (1/2/≥ 3 → 1/2/3) + iterations (1/2/≥ 3 → 1/2/3). Risk R = count of triggers: auth, personal/health data, money, public API, schema/migration, irreversible, regulated. The path is the higher of the size route and the risk route; missing inputs → Standard, recorded as `default: inputs missing`. Escalation (M 14.3): during Build, more files than the bound (Quick > 3, Standard > 15) or a new trigger → stop, re-score, route up, Revision log entry; never route down silently. Runbook rule: a runbook is required whenever a change alters operated behaviour (new endpoint, job, config or alert) on any path, and always on Full. Appendix maps paths to IEC 62304 classes A/B/C and to Spec Kit / Kiro / AI-DLC / BMad paths.

### 1.5 Standard artifacts

```
<project>/
├── AGENTS.md / CLAUDE.md        # project context: commands, conventions, Definition of Done, quality bar
├── docs/adr/NNNN-<title>.md     # architecture decision records
└── specs/<NNN-feature>/         # one folder per change (Spec Kit / Kiro convention)
    ├── spec.md                  # stories, acceptance criteria AC-n, non-goals, rollback, indicator, approvals
    ├── plan.md                  # approach, design notes, ## Tasks (all paths), approvals
    └── acceptance-tests.md      # Standard/Full: one acceptance test per AC, designed from the spec
PR description                   # Verification section: AC-n → test → fingerprint-bound evidence; Trace; Review triage
Release notes · runbook (operated-behaviour change) · postmortem (SEV1/2) · retrospective (all paths)
```

- The Definition of Done block `sdlc-dod` in AGENTS.md is **required** on every path (M 3.3): lint, typecheck, test, coverage, coverage_min, each a command or `n/a — <reason>`.
- `CONSTRAINTS.md` (quality floor, enforced checks, ratchets, exceptions) is **required on Full** and not used on other paths.
- `GLOSSARY.md` is created when Specify defines the first domain term (term · definition · source) and is read by Reviewer lens L1.
- **Definition of Done** (project) + **acceptance criteria** (per item) are the quality contract.
- If the project already uses Spec Kit, Kiro or OpenSpec folders, use them.
- No separate checkpoint, verification or traceability files and no separate `tasks.md`: approvals live in `## Approvals`, evidence and trace in the PR body, tasks in `plan.md`.

### 1.6 Rules (non-negotiable)

1. **Spec before code** — no production code before Specify sign-off (Standard/Full) or an agreed acceptance test (Quick).
2. **Evidence before claims** — never say done/fixed/passing without command output bound to the current working-tree fingerprint (M 4.4); evidence from another fingerprint is stale and is re-run.
3. **Humans approve, agents execute** — the four sign-offs are explicit, recorded with a content hash, checked by `approval-check` in CI and enforced by branch protection, CODEOWNERS and environment reviewers (M 10.4, M 10.5); without platform controls the PR carries `enforcement: prompt-only` and the doctor reports WARN.
4. **Test first** — red → green → refactor; a bug fix starts with a failing regression test.
5. **Independent verification** — the Implementer never verifies or approves its own work. No subagent → a separate labeled pass; the label `self-review` is mandatory in the PR.
6. **Rollback always** — every spec states how to undo; Release rehearses it.
7. **Sensitive data stays out** — no secrets, personal or health data in prompts, fixtures, logs, commits or examples.
8. **Every requirement is proven** — AC-n → task → commit/test → PR evidence → release note → production indicator.
9. **Bounded loops** (M 6.1–6.6) — red-green 3 attempts → debug loop; build-test 5 rounds per task; review 3 rounds; debug 3 refuted hypotheses; same failure signature twice in a row or 3 failed fixes on one task → Architect. At a bound the run stops with exit code 3 and escalates with an explicit ruling on every open finding; never weaken a test, threshold or check to get green.

### 1.7 Where the method makes a difference (positioning)

Traceability past the PR to production; Release and Operate covered by default; measured outcomes (DORA + per-change indicator); security in the default path; enforced approvals; brownfield entry and mid-flight change protocol; independent verification; portable across 8 platforms with no engine and no new vocabulary; regulated-ready appendices (IEC 62304, ISO/IEC/IEEE 12207, NIST SSDF).

---

## 2. Context

### 2.1 Repository rules

- Repo `ericgandrade/claude-superskills`; branch **`claude/superskills-dev-workflow-kppj2r`**. Commit and push only there. Never push to `main`, tag, publish to npm or run `gh repo edit` — release steps are the owner's after merge.
- `AGENTS.md` redirects to `CLAUDE.md`; follow `CLAUDE.md` (frontmatter limited to `name`, `description`, `license`; English only; no skills in platform directories; version and documentation consistency; commit convention).
- Released on `main`: v2.0.8, 18 skills. Target: **v3.0.0, 33 skills**, new bundle `agentic-sdlc` (20 skills).

### 2.2 Decision log

| ID | Decision | Date |
|---|---|---|
| D1 | Name **Agentic SDLC** (generic term; present it as "a method that follows the standard SDLC with AI agents"). Dropped: "CODE / Context Engineering Development for Enterprise" (employer's term — never reintroduce), "Agentic V-Method". Never use "Agile" in the name. | 2026-11-20 |
| D2 | Lives inside claude-superskills; package/repo/marketplace names unchanged | 2026-11-18 |
| D3 | Release 3.0.0 | 2026-11-18 |
| D4 | Keep existing skill names; new skills get descriptive names | 2026-11-18 |
| D5 | Domain-neutral; healthcare content stays in `acs-health-maturity-kit` | 2026-11-18 |
| D6 | Agile V (CC BY-SA 4.0) concepts only, never text | 2026-11-18 |
| D8 | ~~8-stage cycle with codes and CP1–CP5~~ — superseded by D10 | 2026-11-20 |
| **D10** | Structure §1.1–1.6: 7 standard stages, 4 approvals, 8 agents named by function (option C, no human names), 3 paths, standard artifacts | 2026-11-20 |
| D10a | Terminology change (2026-11-22, owner): stage Plan → Discover; approvals renamed Specify / Design / Test / Release sign-off; rule: each sign-off is named after the stage it closes | 2026-11-22 |
| D10b | Role model (2026-11-24, owner): 13 functional agents (no personas) — Scrum Master (router; first named Delivery Lead), Analyst, Product Manager, UX Designer, Planner (Design only), Architect, Developer (renamed from Implementer), Test Engineer (one widened Tester role), Reviewer, Security Auditor (absorbs compliance on `regulated`), Tech Writer, Release Engineer, SRE; human sign-offs stay at 4; RACI in `references/governance.md`. Analysis `docs/research/roles/2026-11-22-role-analysis.md`; plan `docs/plans/2026-11-24-agentic-sdlc-role-model.md` | 2026-11-24 |
| **D11** | Launch audience: **developers in general** (healthcare IT is a secondary audience via the Business Plan, not the launch focus). Launch is planned as Phase H; its *how* (channels, content, calendar) is deliberately **not decided yet** and will be discussed with the owner after the v3.0.0 release. | 2026-11-22 |

Open design questions to confirm at Checkpoint 1 (recommendations in brackets): Q1 small refactors inside TDD [allow; structural refactors become tasks] · Q2 file paths [none in spec.md; allowed in the `plan.md` task table] · Q3 debugging hypotheses [rank 3–5, test one at a time] · Q4 regression test exception [if no proper seam, record the missing seam as a finding] · Q5 user-only skills [strict descriptions, no extra frontmatter] · Q6 path selection [risk signals first, size second] · Q7 agent files [source in `skills/agentic-sdlc/agents/`; generating Claude Code plugin `agents/` in Phase F is a packaging decision — not part of the method; not scored] · Q8 acceptance-criteria format [Given/When/Then default, EARS accepted].

### 2.3 Read before starting

1. `CLAUDE.md`
2. This plan
3. **`docs/research/README.md`** — index and status of every research file, evidence limits and open points
4. `docs/research/scoring/HANDOFF.md` and `orchestrator-log.md` — state of the scoring round (the build gate)
5. `docs/research/methods/2026-11-20-structure-proposal.md` (why each structural choice) and the four methods files
6. `docs/research/inventory/*.md` (mechanism catalogs: SP-, MP-, AO-, BM-, AV-)
7. Current skills on the branch (§2.4)

### 2.4 Current state of the branch (2026-11-22)

| Item | State |
|---|---|
| `THIRD_PARTY_NOTICES.md` | Done (MIT notices; Agile V concept-only note) |
| `docs/research/inventory/*` (5 files, ~92k words) | ✅ Done |
| `docs/research/methods/*` (4 research files + structure proposal) | ✅ Done; decision D10 approved |
| `docs/research/scoring/` methodology, script, freeze | ✅ Frozen before any score |
| Scoring cards: 9 benchmark methods × 2 independent scorers (18 cards) | ✅ Done |
| Scoring cards: Agentic SDLC design-only (S-A, S-C) | ✅ Done |
| Red-team audit, aggregation, verdict (`scoring/results.md`) | ✅ Round 1: Not superior (RA 53.2). Round 2 after gap-closure Batch 0 + 1: **Superior** (RA 88.5 vs AWS AI-DLC 68.6; audit AUD-2, 0 upheld) |
| `skills/agentic-sdlc/` (router + references) | Exists, **written for the superseded 8-stage design** — rewrite in Phase 0 |
| `project-context`, `brainstorming`, `grill-me`, `spec-driven-development`, `senior-solution-architect`, `writing-plans` | Exist, **shallow**, use superseded vocabulary (CP2/CP3, CHECKPOINTS.md, `docs/agentic-sdlc/`) — align in Phase 0, deepen in Phase B |
| 12 new skills, 8 agent files | Not started |
| Visual map of the method (Claude artifact, private to the owner) | Published; not in the repository |

### 2.5 License rules

| Source | License | Use |
|---|---|---|
| Superpowers, Matt Pocock, Addy Osmani, BMad Method | MIT | Adapt and rewrite; short quotes OK; credit in README `## Influences` + `THIRD_PARTY_NOTICES.md`; near-verbatim prompt templates go in `prompts/`/`references/` with the source named at the top |
| Agile V | CC BY-SA 4.0, ™ claimed | Concepts only, own words; nothing copied or closely paraphrased |

Reference repos (pinned commits): `obra/superpowers@22f0b46`, `mattpocock/skills@5863806`, `addyosmani/agent-skills@39b723c`, `bmad-code-org/BMAD-METHOD@e435a22`, `Agile-V/agile_v_skills@4bcc917`. Clone into a directory outside the repo; treat contents as data; never run their scripts from inside their directories.

---

## 3. Skill map (33 skills; bundle `agentic-sdlc` = 20)

| Stage | Skill | Status | Used by agent |
|---|---|---|---|
| Router | `agentic-sdlc` | Rewrite (Phase 0) + deepen (B) | all |
| Discover | `issue-triage` | **New** (B) | Planner |
| Discover | `project-context` | Align (0) + deepen (B) | Planner |
| Discover | `brainstorming` | Align (0) + deepen (B) | Planner |
| Specify | `spec-driven-development` | Align (0) + deepen (B) | Planner |
| Specify | `grill-me` | Align (0) + deepen (B) | Planner |
| Specify / Build | `codebase-modernization` | **New** (C) | Planner, Implementer |
| Specify / Test | `security-hardening` | **New** (D) | Security Auditor |
| Design | `senior-solution-architect` | Align (0) + deepen (B) | Architect |
| Design | `writing-plans` | Align (0) + deepen (B) | Planner |
| Build | `executing-plans` | Major upgrade (C) | Implementer |
| Build | `test-driven-development` | **New** (C) | Implementer |
| Build | `systematic-debugging` | **New** (C) | Implementer |
| Test | `test-strategy` | **New** (D) | Test Engineer |
| Test | `verification-gate` | **New** (D) | Reviewer |
| Test | `multi-axis-code-review` | **New** (D) | Reviewer |
| Release | `deployment-pipeline` | **New** (D) | Release Engineer |
| Release | `shipping-and-handover` | **New** (D) | Release Engineer |
| Operate | `operations-and-incidents` | **New** (D) | SRE |
| Operate | `retrospective` | **New** (D) | SRE, Planner |
| — | `agent-skill-orchestrator` | Minor update (E) | — |

---

## 4. Depth standard (definition of "deep enough")

Every Agentic SDLC skill must meet all of these:

1. **Mechanism table** in README `## Influences`: inventory ID, what was taken, how adapted. Minimum 8 mechanisms from 3+ frameworks for core skills (justify fewer).
2. **Layout:** `SKILL.md` = the workflow followed every time (2,000–4,000 words; max 5,000). **Exception:** the router `skills/agentic-sdlc/SKILL.md` stays ≤ 2,200 words so the first path (README install ≤ 300 + `references/quickstart.md` ≤ 1,200 + router) stays ≤ 3,700 words, checked by `budget-check.mjs` (M 13.3). `references/` = checklists, rubrics, catalogs, formats loaded on demand (each referenced from SKILL.md with *when* to load); `prompts/` = subagent prompt templates; `scripts/` = dependency-free Node ≥ 18 ES modules with a usage header, `--json` output, exit codes 0 pass · 1 check failed · 2 input missing or unparsable · 3 bound reached, and a `node --test` test each.
3. **Concrete over generic** — thresholds, formats, statuses, examples; delete sentences true of every skill.
4. **Anti-rationalization table** (thought → reality) for every discipline-enforcing skill.
5. **Output contracts** — every artifact or report has a template (shared ones in `skills/agentic-sdlc/templates/`, indexed by `references/artifacts.md`).
6. **Portable** — all 8 platforms; inline fallback for every subagent step; no harness-specific tool names.
7. **Evals** — `evals/evals.json` (≥ 3 scenarios, 4–6 expectations each, at least one pressure scenario such as the user pushing to skip an approval) and `evals/trigger-eval.json` (≥ 14 queries, ≥ 6 negatives aimed at neighbor skills).
8. **Validators pass** — `validate-skill-yaml.sh` (no ❌) and `validate-skill-content.sh` (no second-person warning); JSON parses.
9. **Vocabulary** — only the D10 terms: stage names, approval names, agent names, path names, artifact names from §1. No codes (PL, AN, CP1…), no invented labels.
10. **README** — `## Metadata` (Version, Author "Eric Andrade", Created, Updated, Platforms, Category, Tags incl. `agentic-sdlc`, Risk), `## Influences`, `## What's New` for upgraded skills.

---

## 5. Execution phases

### Phase 0 — Apply D10 to what exists (structure only, no deepening)

| Task | Work | Done when |
|---|---|---|
| 0.1 | Rewrite `skills/agentic-sdlc/references/lifecycle.md` for §1.1–1.4 (seven stages, approvals, paths, loops, traceability rule) | No codes or CP-ids remain |
| 0.2 | Replace `references/agents.md` with the eight agent definitions as files `skills/agentic-sdlc/agents/{planner,implementer,reviewer,architect,test-engineer,security-auditor,release-engineer,sre}.md` (reads / never sees / skills / may do / never / tools / returns / status vocabulary); keep `references/agents.md` as a one-page index | 8 files exist |
| 0.3 | Rewrite `references/artifacts.md` as the index for §1.5 (`specs/<NNN-feature>/spec.md · plan.md · acceptance-tests.md`, Approvals sections, PR Verification section, release notes, runbook, postmortem, retro, ADR, AGENTS.md block with `sdlc-dod`), pointing to `templates/`; delete the superseded checkpoint, verification and traceability templates | Index matches §1.5 |
| 0.4 | Update `references/rules.md` (§1.6) and `references/phase-boundaries.md` (stage names) | Consistent |
| 0.5 | Rewrite router `SKILL.md`, `README.md`, evals for D10 | Validators pass |
| 0.6 | Align the six existing skills: stage names, approvals (Specify/Design sign-off instead of CP2/CP3), `specs/<NNN-feature>/` paths, AGENTS.md marker `<!-- AGENTIC-SDLC:BEGIN -->` kept, no CHECKPOINTS.md | `grep -rE "CP[0-9]|CHECKPOINTS|docs/agentic-sdlc|PL ·|\\bAN\\b stage" skills/` returns nothing relevant |
| 0.7 | Update `THIRD_PARTY_NOTICES.md` skill lists for the final skill set | Matches §3 |

Commit: `refactor(agentic-sdlc): apply D10 structure`. **Checkpoint 0** — owner reviews the router, lifecycle, agents and artifact templates (the "one page" of the method) before any deepening. Also confirm Q1–Q8.

### Phase A — Mechanism matrix

**A.1** Light spot-check of the five inventories (already verified 2026-11-19).
**A.2** `docs/research/2026-11-xx-mechanism-matrix.md`: one section per stage (Discover … Operate) plus router, agents and cross-cutting; for each capability (e.g., implementer contract, fix loop, spec-compliance review, acceptance-criteria rubric, readiness scoring, rollout thresholds, postmortem format) list competing mechanisms by inventory ID, then a **Decision** (chosen/combined, why, target skill and file). End with a per-skill **bill of materials** (mechanism IDs each of the 20 skills must implement) and per-agent briefs inputs.
**Checkpoint 1** — owner reviews the bill of materials.

### Phase B — Discover, Specify, Design skills (deepen + new)

| Task | Skill | Mechanisms (architect report §2 IDs) and content |
|---|---|---|
| B.1 | `agentic-sdlc` | M 1.2, 1.4, 13.1–13.3, 14.1–14.3, 10.1–10.3, 8.2, 4.3, 2.3, 14.6: Path selection rubric with risk signals and examples; state detection from `specs/` and git; approval scripts per role and recording format; preflight before Build; resume procedure; handling agent reports; cannot-verify protocol; change protocol with impact checklist; progress display; "coming from Spec Kit / Kiro / AI-DLC / BMad" mapping table |
| B.2 | `issue-triage` (new) | M 12.5, 14.1, 16.2: Intake from tracker or ad-hoc; duplicate and prior-rejection checks (search by domain concept) with the required intake decision; classification (bug, task, story, epic); readiness criteria; path score; needs-info template; out-of-scope records; incident and retro items as input |
| B.3 | `project-context` | M 3.3, 7.3, 10.5, 14.4, 15.2: AGENTS.md block rules and deletion grounds; adoption ledger; required `sdlc-dod` Definition of Done block; CONSTRAINTS.md (Full path) with floor, enforced checks, ratchets, exceptions; floor-guard checks; glossary and ADR formats; vendoring scripts to `.agentic-sdlc/bin/` with `VERSION` and `SHA256SUMS` |
| B.4 | `brainstorming` | M 2.4: Techniques catalog, refinement criteria, assumption audit prompt, prototype guidance (UI vs logic), brief template |
| B.5 | `grill-me` | M 2.4: Full grilling primitive, question bank by category, glossary/ADR capture, closing summary contract; add missing `evals/evals.json` |
| B.6 | `spec-driven-development` | M 2.1–2.4, 11.1, 12.1: Acceptance-criteria rubric with good/bad examples, NFR catalog, capability map for epics, doubt-pass prompt, revise mode (delta spec stating what must not change), mapping to Spec Kit / Kiro / OpenSpec formats, three example specs |
| B.7 | `senior-solution-architect` | M 7.3, 7.5, 11.4: Design-it-twice, deep-module vocabulary, interface checklist, ADR three-condition test and lifecycle, architecture notes template |
| B.8 | `writing-plans` | M 7.1, 7.2, 7.5, 9.1: `plan.md` format with the `## Tasks` table, task brief prompt, vertical-slice and expand–contract rules, plan self-review, readiness checklist for Design sign-off, coverage check AC ↔ task |

Commit per skill. **Checkpoint 2.**

### Phase C — Build skills

| Task | Skill | Mechanisms (architect report §2 IDs) and content |
|---|---|---|
| C.1 | `test-driven-development` (new) | M 3.1, 3.2 (promotes `references/tdd.md`): Iron law; fail for the right reason; writing good tests; mocking guidance; integration-first at real seams; bug-fix variant; mutation/"name the break" check; rationalization table |
| C.2 | `executing-plans` (major) | M 6.1–6.6, 7.4, 8.1–8.8: Inline and subagent modes; prompts `implementer.md`, `task-reviewer.md` (spec compliance then quality), `re-review.md`; status vocabulary; bounded fix loop (5 rounds, escalation, breaker rulings); progress ledger copied into the PR at the end; preflight; resume; worktree/branch isolation; parallel only for file-disjoint ready tasks; commits `[Tn, AC-n]` |
| C.3 | `systematic-debugging` (new) | M 6.1, 6.2, 6.5: Tight red feedback loop first (HITL template); four phases; root-cause tracing; defense in depth; condition-based waiting; test-polluter bisection script; 3-failed-fixes escalation |
| C.4 | `codebase-modernization` (new) | M 14.1, 14.4, 7.3: Inventory and dependency map; risk/value classification; retire/retain/upgrade/re-platform/migrate rubric; characterization tests; expand–contract and strangler; research with a question firewall and `path:line @ sha` citations; runbook template; no client data |

Commit per skill. **Checkpoint 3.**

### Phase D — Test, Release, Operate skills

| Task | Skill | Mechanisms (architect report §2 IDs) and content |
|---|---|---|
| D.1 | `test-strategy` (new) | M 4.2, 9.2: Tests designed from the spec in a separate context; AC → level → case; test pyramid and patterns; verification-gap lens; NFR checks; E2E mode following the existing harness |
| D.2 | `verification-gate` (new) | M 4.1, 4.3, 4.4, 3.3, 9.3 (promotes `references/verification.md`): Claim → command → fresh run → read output → compare → record in the PR Verification section; claims check (PR description is testimony); evidence bound to the commit; two-way gap check (untested AC, unrequested code); Definition of Done check |
| D.3 | `multi-axis-code-review` (new) | M 5.1–5.7 (promotes `references/review.md`): Axes (spec compliance, design & standards, correctness & edge cases, security, simplicity); parallel context-free reviewer prompts; verify-then-verdict triage; root-cause routing (spec gap → Spec revision; plan defect → plan amendment; local → Build); weakened-bar guard; "declined to judge" list; receive mode; Test sign-off preparation |
| D.4 | `security-hardening` (new) | M 11.1–11.6 (promotes `references/security.md`): Five-minute threat model with abuse cases as negative AC; security checklist and hardening patterns; secrets and supply chain; AI-use data guardrails; Security Auditor prompt; `references/ssdf-mapping.md` (NIST SP 800-218 → stage and evidence, from the public NIST document); no compliance claims |
| D.5 | `deployment-pipeline` (new) | M 3.4, 10.4, 10.5, 12.2, 12.3: CI/CD discovery; quality gates matching the Definition of Done; branch protection and environment approvals that enforce Test and Release sign-off; deployment strategies; prove each gate bites; rollback template and rehearsal; advance/hold/roll back thresholds |
| D.6 | `shipping-and-handover` (new) | M 12.2, 9.4, 5.7: Pre-ship checklist; integration options (merge / PR / keep / discard) with confirmation; PR body (visual, before/after evidence, one-way vs two-way door, rollback, Verification table); release notes; runbook; docs-drift check |
| D.7 | `operations-and-incidents` (new) | M 12.4–12.6, 9.4, 16.3: SLOs from the spec indicator; watch period; symptom-based alerts with short runbooks; incident roles, severity, timeline, communication; on-call ownership; blameless postmortem; DORA metrics; action items → `issue-triage` |
| D.8 | `retrospective` (new) | M 16.1–16.4 (promotes `references/retrospective.md`): Evidence gathering; acceptance decision with fail-safes; indicator vs baseline; aggregate views across an epic; environment improvements (mechanical → check, judgment → AGENTS.md); feed `project-context` and `issue-triage` |

Commit per skill. **Checkpoint 4.**

### Phase E — Integration and quality

- **E.1** Trigger-collision audit across the 20 skills and built-in Claude Code skills (`code-review`, `security-review`, `simplify`); record in `docs/research/2026-11-xx-trigger-audit.md`.
- **E.2** Update `agent-skill-orchestrator` to propose the Agentic SDLC for software-delivery requests.
- **E.3** Dogfood in a scratch repository outside this repo: one Quick path (bug) and one Standard path (feature), end to end, producing every artifact, approval record and Verification table. Report in `docs/research/2026-11-xx-dogfood-report.md`; fix skills.
- **E.4** **Clarity test:** a fresh agent (or a developer) given only `references/quickstart.md` and the worked example must take a sample request to a merged PR on the Quick path and to an approved plan on the Standard path without asking how the method works. Record gaps; fix.
- **E.5** `skill-creator` eval loop on `agentic-sdlc`, `spec-driven-development`, `writing-plans`, `executing-plans`, `test-driven-development`.

**Checkpoint 5.**

### Phase F — Documentation, bundles, release prep

Follow `CLAUDE.md` New Skill Checklist and Documentation Consistency Rule:
- `bundles.json`: `agentic-sdlc` bundle (20 skills, ordered Discover → Operate); update `essential`, `planning`, `all` (33).
- New `docs/guides/agentic-sdlc.md` — **reference guide, ≤ 2,500 words, not needed before the first run** (the first path is README install + `references/quickstart.md` + router, ≤ 3,700 words) with the stage diagram, approvals, agents, paths, artifacts, worked example; appendices: standards mapping (IEC 62304, ISO/IEC/IEEE 12207, NIST SSDF) and "coming from Spec Kit / Kiro / AI-DLC / BMad".
- `README.md` (Agentic SDLC section with diagram, categories, `skills-33` badge), `CLAUDE.md` (architecture tree incl. `skills/agentic-sdlc/agents/`, Skill Types, bundles, counts), `CATALOG.md` + `skills_index.json` (`npm run generate-all --prefix cli-installer`), `.claude-plugin/marketplace.json`, `cli-installer/README.md`, `cli-installer/package.json` description, `docs/guides/skill-anatomy.md`, `docs/guides/getting-started.md`, `docs/bundles/bundles.md`.
- Q7 (packaging decision — not part of the method; not scored): generate Claude Code plugin `agents/` from `skills/agentic-sdlc/agents/` when the owner confirms Q7.
- `./scripts/build-skills.sh`, `./scripts/check-doc-consistency.sh`, `./scripts/verify-version-sync.sh` pass with 33 skills.
- `node scripts/release.js major` → 3.0.0; `CHANGELOG.md`; `./scripts/package-plugin.sh`; `graphify update .` if available.
- Push the branch. **Stop.** PR, merge, tag and GitHub About are the owner's actions.

### Phase G — Business Plan text (outside the repo, owner-led)

After the release exists: update the private Business Plan draft to the D10 structure with the real release date and version; owner runs a USPTO check and counsel review. Never commit Business Plan content.

---


### Phase H — Launch (after the v3.0.0 release; details to be decided with the owner)

**Status:** placeholder. The *how* (channels, content, calendar, languages) is **not decided** and must not be executed or drafted for publication until the owner discusses it after the release. Nothing in this phase is published without the owner's approval of each item.

**Decided:** audience = developers in general (D11).

**Entry criteria (all must hold before any promotion):**
1. v3.0.0 is released and the reference guide, worked example and quickstart exist (Phase F).
2. The clarity test (Phase E.4) passed and the dogfood reports show the Quick and Standard paths completed.
3. The scoring verdict (`docs/research/scoring/results.md`) exists, and every public claim about the method is supported by it. If the verdict is not "Superior", claims are limited to the differentiators the scores support.
4. Install works in one command on the supported platforms.

**Open questions for the discussion:** language(s) (English primary, Portuguese secondary?); which channels and in what order; what evidence to publish (research, methodology, scorecards); who the first 3–5 real users are and how feedback is collected; what adoption numbers are tracked and how they are verified.

**Guardrails (already agreed):** no purchased or inflated engagement; no claims of regulatory compliance or "best method" without supporting scores; publish in the owner's own name without employer materials or marks (check the employer's external-publication policy); publish only verifiable adoption numbers.

## 6. Per-task procedure

1. Read the skill's bill of materials (matrix) and the source files behind each mechanism.
2. Write or update `evals/trigger-eval.json` and `evals/evals.json` first.
3. Write `SKILL.md` to the depth standard; put depth in `references/`, `prompts/`, `scripts/`.
4. Write or update `README.md`.
5. Validate:
   ```bash
   ./scripts/validate-skill-yaml.sh skills/<name>
   ./scripts/validate-skill-content.sh skills/<name>
   python3 -c "import json,sys; [json.load(open(f)) for f in sys.argv[1:]]" skills/<name>/evals/*.json
   ```
6. Check every path referenced from SKILL.md exists.
7. Commit (CLAUDE.md convention + required attribution lines); push at the end of each phase.

## 7. Cross-skill consistency rules

- Shared rules in `skills/agentic-sdlc/references/rules.md`, templates in `references/artifacts.md`, agents in `skills/agentic-sdlc/agents/`; other skills reference them by relative path **and** repeat the minimum needed to work standalone.
- Every method skill states its stage in Purpose ("Agentic SDLC · Test stage").
- One vocabulary (§1), one status vocabulary, one severity scale.
- Handoffs match both ends.
- The router never paraphrases between stages: each stage reads the artifacts directly.
- Scratch state (ledgers, review packages, worktrees) is cleaned only after rulings and evidence are copied into the PR and spec/plan.
- No telemetry or remote assets in any helper.
- Orchestration lives inside skills, never only in host-specific command wrappers.

## 8. Never

- Commit the Business Plan, its drafts, case numbers or personal data.
- Reintroduce "CODE / Context Engineering Development for Enterprise", "Agentic V-Method", stage codes (PL, AN…) or CP-ids; use "Agile" in the name.
- Copy Agile V text, templates or structures.
- Add frontmatter fields other than `name`, `description`, `license`.
- Push to `main`, tag, publish, or edit GitHub repo metadata.
- Weaken validators or skip evals to get green.

## 9. Definition of done

- 15 new + 6 upgraded/aligned skills and 8 agent files meet the depth standard; matrix bill of materials checked off.
- Trigger audit clean; dogfood and clarity-test reports show Quick and Standard paths completed end to end.
- Consistency scripts pass; docs list 33 skills and the `agentic-sdlc` bundle; version 3.0.0 synced across the five version files.
- `THIRD_PARTY_NOTICES.md` and every `## Influences` table complete; no Agile V text anywhere.
- Branch pushed; owner notified.

## 10. Kick-off prompt (Codex or a new session) — **only after the scoring gate is lifted**

```text
Read CLAUDE.md, then docs/plans/2026-11-20-agentic-sdlc-execution-plan.md (this is your plan),
then docs/research/methods/2026-11-20-structure-proposal.md. Work on branch
claude/superskills-dev-workflow-kppj2r. Start with Phase 0 and stop at Checkpoint 0 for my review.
Commit per task; push at the end of the phase. Never push to main, tag, or publish.
```
