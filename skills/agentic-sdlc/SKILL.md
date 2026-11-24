---
name: agentic-sdlc
description: This skill should be used when the user wants to run software work end to end through the Agentic SDLC (Discover, Specify, Design, Build, Test, Release, Operate) with AI agents and four human sign-offs — starting a feature, bug fix or modernization the disciplined way, asking which stage or step comes next, resuming from specs/ artifacts, choosing the Quick, Standard or Full path, or handling a requirement change after Specify sign-off.
license: MIT
---

# Agentic SDLC

## Purpose

Run software delivery through the standard life cycle with AI agents: **7 stages** (Discover → Specify → Design → Build → Test → Release → Operate), **4 human sign-offs** (Specify, Design, Test, Release), **13 agents** named by function; specialists run only on their triggers (`references/agents.md`) and **3 paths** sized by a scored rubric (Quick, Standard, Full). Agents execute; named humans approve. Operate feeds the next Discover.

**Sign-off** — a recorded human approval that closes a stage: Specify, Design, Test and Release sign-off. Specify and Design sign-offs are rows in the `## Approvals` section of `spec.md` and `plan.md`; the Test sign-off is the approving PR review; the Release sign-off is the `## Approval` section of the release notes.

One rule ties the cycle together: **every requirement is proven.** Acceptance-criterion IDs (`AC-n`) trace from `spec.md` through plan tasks, commit trailers, test names, fingerprint-bound evidence and the PR to the release notes and the production record.

This file is the router. It detects state, picks the path, dispatches the agent for the current stage, enforces the approvals and loads modules just in time from the Module Index. It never paraphrases one stage's output for the next: each stage reads the artifacts directly.

## When to Use

- Starting a feature, change, bug fix, migration or modernization with a path from request to production.
- Asking "what's next?", "where are we?" or "which stage now?" on software work.
- Resuming in a repository that contains `specs/NNN-slug/` folders, `.agentic-sdlc/` or the AGENTS.md block `<!-- AGENTIC-SDLC:BEGIN -->`.
- A requirement changes after Specify sign-off.
- Entering one stage directly (specify, design, build, test, release, operate).
- An incident, alert or retro action must re-enter the cycle.

Not for one-off explanations or line-by-line edits the user directs. Pure ideation → `brainstorming`. Executing an existing plan outside the method → `executing-plans`.

## Workflow

### Step 0 — Detect state

Run the status command once, first match wins:

1. `node .agentic-sdlc/bin/status.mjs --json`† (vendored into the project by `project-context`).
2. `node <this skill>/scripts/status.mjs --json`†.
3. Neither exists or Node is absent → apply the table below by reading the files.

| # | State (first match from the top) | Detected by | Next step |
|---|---|---|---|
| 1 | No AGENTS.md block | No `<!-- AGENTIC-SDLC:BEGIN -->` in AGENTS.md or CLAUDE.md | Run `project-context` setup (adopt mode on an existing codebase) |
| 2 | No spec | Request present, no `specs/*/spec.md` for it, path not Quick | Discover: score the path, then Specify with the Analyst |
| 3 | Spec unapproved | `## Approvals` empty or hash ≠ current spec hash | Run `spec-lint`; request Specify sign-off |
| 4 | Plan missing | Valid Specify sign-off, no `plan.md` | Design with the Planner (+ Architect) |
| 5 | Plan unapproved | `plan.md` approval missing or hash void | Run `plan-graph`; request Design sign-off |
| 6 | Tasks open | Tasks in `plan.md` without a commit carrying their Tn | Build the next unblocked task (Developer) |
| 7 | PR without evidence | PR open; Verification rows missing or stale | Test: Test Engineer + Reviewer |
| 8 | Released without retro | Release notes exist; no retro record within 5 business days | Retro (`references/retrospective.md`) |
| 9 | Retro actions open | Retro action without `done` or `dropped: <reason>` | Work the oldest action as a Discover item |
| — | Nothing open | None of the above | Ask for the next request |

Unparsable artifact → state `UNKNOWN`, recommend `project-context audit` and `references/faq.md`†; the status script† exits 2. Confirm a resume in one line before acting (Example 4).

When the user names a stage, check its entry condition (`references/lifecycle.md` §1) and report each missing prerequisite. Never skip one silently.

### Step 1 — Choose the path

Score every item with `references/paths.md` §Score (or `scripts/path-score.mjs`†):

- **Size S** = files (≤ 3: 1 · 4–15: 2 · > 15: 3) + components (1/2/≥ 3 → 1/2/3) + iterations (1/2/≥ 3 → 1/2/3). S ≤ 4 Quick · 5–6 Standard · ≥ 7 Full.
- **Risk R** = count of triggers: auth, personal/health data, money, public API, schema/migration, irreversible, regulated. R = 0 Quick · R = 1 Standard · R ≥ 2, personal/health data or irreversible → Full.
- **Path = the higher route.** Write the score line in the issue or spec header: `Path: Standard · S=5 · R=1 (money)`.

Missing inputs → Standard, recorded as `default: inputs missing`. During Build, more files than the path bound (Quick > 3, Standard > 15) or a new trigger → stop, re-score, route up and log a Revision entry. Never route down silently.

| Path | Sign-offs | Artifacts |
|---|---|---|
| Quick | Test (+ Release when production deploys) | Issue with acceptance test, PR with Verification |
| Standard | Specify + Design (one combined review when ≤ 5 tasks), Test, Release | `spec.md`, `plan.md`, `acceptance-tests.md`, PR, release notes, retro |
| Full | All four separately + second human reviewer on the Test sign-off (PR) | Standard set + ADRs, threat model, `CONSTRAINTS.md`, runbook |

### Step 2 — Run the stage

Dispatch the lead agent with its file from `agents/` and only the inputs it lists (`references/phase-boundaries.md` §Context hygiene). No subagents on the platform → run a separate labeled pass and mark every check of the author's own work `self-review` in the PR.

| Stage | Lead agent (helpers) | Load | Exit record |
|---|---|---|---|
| Discover | Analyst (Product Manager) | `references/paths.md` | Score line, intake record |
| Specify | Analyst (Product Manager, UX Designer, Security Auditor) | `templates/spec.md`, `references/governance.md` | `spec.md`, `spec-lint` exit 0 |
| Design | Planner (Architect) | `templates/plan.md` | `plan.md`, `graph.json`, ADRs |
| Build | Developer, one per task (Tech Writer: docs task) | `references/tdd.md`, `references/loops.md` | Commits `Refs: Tn AC-n`, DoD green, PR |
| Test | Reviewer (Test Engineer, Security Auditor, UX Designer) | `references/verification.md`, `references/review.md` | PR Verification, Trace, Review triage; GO/NO-GO |
| Release | Release Engineer (Tech Writer) | `references/release-ops.md` | Release notes, rehearsal output |
| Operate | SRE | `references/release-ops.md`, `references/retrospective.md` | `ops.md`, postmortems, retro |

Stage skills: `project-context` (Discover), `brainstorming` and `grill-me` (Discover/Specify), `spec-driven-development` (Specify), `senior-solution-architect` and `writing-plans` (Design), `executing-plans` (Build).

### Step 3 — Request and record approvals

1. Present the artifact, the evidence reviewed and the residual risks; ask the named role for a decision; **end the turn**.
2. Only an explicit "yes" or "approved" in a later turn counts. Record sign-off, rev + 12-hex hash, date, role, person, exact words, evidence, residual risks, decision (`references/governance.md`).
3. Any later edit to an approved file changes its hash and voids the approval → change protocol (`references/rules.md`). Rows appended to the plan's `## Loop ledger` are excluded from the hash.
4. Proceeding past a failed gate requires a waiver: owner ≠ requester, reason, expiry ≤ 30 days, follow-up issue.

### Step 4 — Keep loops bounded

Red-green 3 attempts → debug loop. Build-test 5 rounds per task, review 3 rounds, debug 3 refuted hypotheses → `ESCALATE` with a ruling requested on every open item. Same failure signature twice in a row, or 3 failed fixes on one task → design question for the Architect. Route each failure by cause: spec → Specify, design/plan → Design, code/test → Build, env → preflight (`references/loops.md`).

### Step 5 — Show progress

The router acts as Scrum Master (`agents/scrum-master.md`). Print the position at every stage transition:

```
Agentic SDLC · Standard · specs/001-csv-export
Discover ✅ ▸ Specify ✅ Specify sign-off ▸ Design ✅ Design sign-off ▸ Build 🔄 T4/7 ▸ Test ⏳ ▸ Release ⏳ ▸ Operate ⏳
```

## Module Index

Load a module only at its trigger. A listed file that is absent in the installed version → follow the rule summary in this router, record `module missing: <path>` in the PR body, and continue. † = added in a later release; manual fallback: `references/artifacts.md` §Later-release files.

**First path** (≤ 3,700 words in total: README install section, `references/quickstart.md`, this file). **Off-first-path rule:** the Full path, unattended mode, extensions and metrics are loaded only after the first merged PR or on explicit request.

| File | Load when |
|---|---|
| `references/quickstart.md` | First use; one Quick-path bug fix end to end |
| `references/lifecycle.md` | A stage's entry or exit condition is in question |
| `references/rules.md` | Any rule conflict; requirement change after approval |
| `references/artifacts.md` | Creating the first artifact in a project |
| `references/agents.md`, `agents/<name>.md` | Dispatching that agent |
| `references/phase-boundaries.md` | Stage end, context ≥ 70%, hand-off, resume |
| `references/paths.md` | Discover; escalation in Build |
| `references/platforms.md` | Host lacks subagents, permissions or CI |
| `references/governance.md` | Any approval or waiver; enforcement setup |
| `references/tdd.md` | Each Build task |
| `references/loops.md` | A test or review round fails |
| `references/autonomous.md` | User asks to run unattended (after Design sign-off) |
| `references/verification.md` | Any completion claim; PR Verification and Trace |
| `references/review.md` | Test stage; receiving findings |
| `references/security.md` | Spec Security notes; review lens L3; new dependency |
| `references/release-ops.md` | Release; alerts; incidents; production intake |
| `references/retrospective.md` | After Release; Quick batch due |
| `references/faq.md`† | Status `UNKNOWN`; doctor† FAIL |
| `references/upgrading.md`† | Skill version changed; doctor† schema WARN |
| `references/adoption.md` | Team rollout; existing Spec Kit, Kiro or OpenSpec folders |
| `references/brownfield.md` | Touching code without tests |
| `references/extension-interface.md`† | Loading or writing an extension |
| `references/standards-mapping.md`†, skill `security-hardening` | Audit export; regulated work |
| `templates/spec.md`, `ux.md`, `plan.md`, `acceptance-tests.md` | Specify; UX trigger; Design; acceptance-test design |
| `templates/pr-body.md`, `release-notes.md`, `retro.md` | Opening a PR; Release; retro |
| `templates/codemap.md`, `threat-model.md` | Brownfield adoption; risk-triggered spec |
| `templates/ops-record.md`, `postmortem.md`, `runbook.md` | Operate; SEV1/2 incident; operated-behaviour change |
| `templates/ci/agentic-sdlc.yml`, `ci/gitlab-ci.yml`, `ci/security.yml`, `CODEOWNERS` | `project-context` CI and enforcement setup |
| `scripts/spec-lint.mjs`, `plan-graph.mjs` | Before Specify / Design sign-off; CI |
| `scripts/preflight.mjs`, `run-ledger.mjs` | Build start; unattended runs; each loop round |
| `scripts/evidence.mjs`†, `trace-check.mjs`†, `dod-gate.mjs`† | Completion claims; before Test sign-off; CI |
| `scripts/approval-check.mjs`†, `audit-export.mjs`† | CI on every PR; audit request |
| `scripts/status.mjs`†, `doctor.mjs`†, `path-score.mjs`† | Step 0; setup check; Discover |
| `scripts/budget-check.mjs`, `ext-check.mjs`†, `metrics.mjs`† | CI on `skills/**`; extensions; each retro |
| `scripts/lib/md.mjs`, `lib/git.mjs`, `lib/cli.mjs` | Imported by the scripts above |
| `examples/worked-example/` | Learning the Standard path; script test fixtures |
| `examples/paths/`†, `examples/extensions/`† | Checking a path decision; writing an extension |

Scripts are dependency-free Node ≥ 18 ES modules. Exit codes: `0` pass · `1` check failed · `2` input missing or unparsable · `3` bound reached, escalate. `--json` prints a machine-readable result. Node absent → the method runs from the Markdown rules and the doctor† reports `enforcement: prompt-only`.

## Critical Rules

- **NEVER** write production code before valid Specify and Design sign-offs (Standard/Full) or an acceptance test in the issue (Quick).
- **NEVER** treat silence, enthusiasm or "whatever you think" as approval. Ask, end the turn, record the exact words.
- **NEVER** let the Developer verify, test the acceptance criteria of, or approve its own work.
- **NEVER** run a loop past its bound; at the bound, escalate.
- **NEVER** push to the default branch, merge, deploy, tag or access secrets without a human decision; in unattended mode, never push.
- **NEVER** route a path down silently or weaken a test, threshold or `coverage_min` to get green.
- **ALWAYS** claim completion only with DoD and AC output bound to the current fingerprint.
- **ALWAYS** reuse the project's existing conventions (`references/artifacts.md` §Discover) before creating `specs/`.
- **ALWAYS** follow `references/rules.md`; it overrides any module that conflicts with it.

## Example Usage

**1. Feature, Standard path.** "Add CSV export of order IDs, dates and totals to the reports page." S = 2 + 2 + 1 = 5, R = 1 (money) → Standard. Specify: AC-1..4 (filtered rows only, formula-injection escaping, permission check, 50k row limit), rollback = flag off, alert on export error rate > 2% over 15 min. Combined Specify + Design sign-off (5 tasks). Build T1–T5 test-first; Test: acceptance tests designed from the spec, lenses L1–L4, GO. Test sign-off; Release at 10% then 100%; retro within 5 business days. Files: `examples/worked-example/`.

**2. Bug, Quick path.** "The date column shows UTC instead of the user's time zone." S = 3, R = 0 → Quick. Acceptance test in the issue; failing regression test pasted; fix; PR with Verification rows; lenses L1 + L2; Test sign-off. Retro batched.

**3. Risk beats size.** "Sessions expire after 5 minutes instead of 30." S = 3 but R = 1 (auth) → Standard: short spec, combined approval, security lens L3.

**4. Resume.** "Continue the payments refactor." Step 0: spec rev 2 approved with a matching hash, plan approved, T1–T5 committed → "Resume Build at T6?"

**5. Change after approval.** "Product now wants Excel export too." The edit voids the Specify sign-off hash. Change protocol: impact (AC-5, T6, tests), Revision 2, Specify and Design sign-off again, resume at Build.
