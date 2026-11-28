---
name: agentic-sdlc
description: This skill should be used when the user wants to run software work end to end through the Agentic SDLC (Discover, Specify, Design, Build, Test, Release, Operate) with AI agents and four human sign-offs — starting a feature, bug fix or modernization the disciplined way, asking which stage or step comes next, resuming from specs/ artifacts, choosing the Quick, Standard or Full path, or handling a requirement change after Specify sign-off (deciding where it re-enters). It hands each stage to its stage skill and is not for one stage task asked on its own, such as writing a spec, writing or executing a plan, implementing or debugging a task, or reviewing a PR (use that stage skill), nor for non-software multi-skill plans (use agent-skill-orchestrator).
license: MIT
---

# Agentic SDLC

## Purpose

Run software delivery through the standard life cycle with AI agents: **7 stages** (Discover → Specify → Design → Build → Test → Release → Operate), **4 human sign-offs** (Specify, Design, Test, Release), **13 agents** named by function; specialists run only on their triggers (`references/agents.md`) and **3 paths** sized by a scored rubric (Quick, Standard, Full). Agents execute; named humans approve. Operate feeds the next Discover.

**Sign-off** — a recorded human approval that closes a stage (Specify, Design, Test, Release); owners and records: `references/governance.md` §1.

One rule ties the cycle together: **every requirement is proven.** Acceptance-criterion IDs (`AC-n`) trace from `spec.md` through plan tasks, commit trailers, test names, fingerprint-bound evidence and the PR to the release notes and the production record.

This file is the router: it detects state, picks the path, dispatches the stage agent, enforces the approvals and loads modules just in time. It never paraphrases one stage's output for the next; each stage reads the artifacts directly.

## When to Use

- Starting a feature, change, bug fix, migration or modernization from request to production.
- Asking "what's next?" or "where are we?" on software work.
- Resuming in a repository that contains `specs/NNN-slug/` folders, `.agentic-sdlc/` or the AGENTS.md block `<!-- AGENTIC-SDLC:BEGIN -->`.
- A requirement changes after Specify sign-off.
- Entering one stage directly (specify, design, build, test, release, operate).
- An incident, alert or retro action must re-enter the cycle.

Not for one-off explanations or line-by-line edits the user directs. Pure ideation → `brainstorming`. Executing an existing plan outside the method → `executing-plans`.

## Workflow

### Step 0 — Detect state

Run `status.mjs --json` (`.agentic-sdlc/bin/` or `scripts/`): state, evidence, next steps. Node absent → apply this table; first match wins.

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

Unparsable artifact → state `UNKNOWN` (`status.mjs` exit 2), recommend `project-context audit`. Confirm a resume in one line before acting (Example 3).

When the user names a stage, check its entry condition (`references/lifecycle.md` §1) and report each missing prerequisite. Never skip one silently.

### Step 1 — Choose the path

Score with `path-score` (`references/paths.md` §2); **path = the higher route** (§1). Write the score line in the issue or spec header: `Path: Standard · S=5 · R=1 (money)`. Missing inputs → Standard, recorded `default: inputs missing`. During Build, a file bound (Quick > 3, Standard > 15) or a new risk trigger → stop, re-score, route up and log a Revision entry (§4). Never route down silently. Sign-offs and artifacts per path: §3 (Full adds a second human reviewer on the Test sign-off).

### Step 2 — Run the stage

Dispatch the lead agent with its `agents/` file and only the inputs it lists (`references/phase-boundaries.md` §Context hygiene). No subagents → a separate labeled pass; every check of the author's own work is marked `self-review` in the PR.

| Stage | Lead agent (helpers) | Load | Exit record |
|---|---|---|---|
| Discover | Analyst (Product Manager) | `references/paths.md` §1–§4 | Score line, intake record |
| Specify | Analyst (Product Manager, UX Designer, Security Auditor) | `templates/spec.md`, `references/governance.md` | `spec.md`, `spec-lint` exit 0 |
| Design | Planner (Architect) | `templates/plan.md` | `plan.md`, `graph.json`, ADRs |
| Build | Developer, one per task (Tech Writer: docs task) | `references/tdd.md`, `references/loops.md` | Commits `Refs: Tn AC-n`, DoD green, PR |
| Test | Reviewer (Test Engineer, Security Auditor, UX Designer) | `references/verification.md`, `references/review.md` | PR Verification, Trace, Review triage; GO/NO-GO |
| Release | Release Engineer (Tech Writer) | `references/release-ops.md` §Observability, §Release checklist, §Go/no-go, §Runbook | Release notes, rehearsal output |
| Operate | SRE | `references/release-ops.md` §Incidents, §Intake; `references/retrospective.md` | `ops.md`, postmortems, retro |

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

Load a module only at its trigger; `§` names the sections to read. A listed file absent in the installed version → follow this router's rule summary, record `module missing: <path>` in the PR body and continue. A file marked † is planned: `references/artifacts.md` §Later-release files gives its version and manual fallback.

**First path** (≤ 3,700 words: README install section, `references/quickstart.md`, this file). The Full path, unattended mode, extensions and metrics load only after the first merged PR or on request.

| File | Load when |
|---|---|
| `references/quickstart.md` | First use; one Quick-path bug fix end to end |
| `references/lifecycle.md` | A stage's entry or exit condition is in question |
| `references/rules.md` | Any rule conflict; requirement change after approval |
| `references/artifacts.md` §Step 0, §Default layout, §Naming and numbering, §AGENTS.md block, §ADR | First artifact in a project (§Artifact table, §CONSTRAINTS.md when that artifact is in doubt or made) |
| `references/agents.md`, `agents/<name>.md` | Dispatching that agent |
| `references/phase-boundaries.md` | Stage end, context ≥ 70%, hand-off, resume |
| `references/paths.md` §1–§4 | Discover; escalation in Build; §5 brownfield adoption |
| `references/platforms.md` | Host lacks subagents, permissions or CI; model per role |
| `references/governance.md` | Any approval or waiver; enforcement setup |
| `references/tdd.md` · `loops.md` | Each Build task · a test or review round fails |
| `references/autonomous.md` | Run unattended (after Design sign-off) |
| `references/verification.md` | Any completion claim; PR Verification and Trace |
| `references/review.md` | Test stage; receiving findings |
| `references/security.md` §Data classification, §Secrets, §Dependencies, §Review checklist | Spec Security notes; lens L3; new dependency; §Compliance when `regulated` fires |
| `references/release-ops.md` | Release; alerts; incidents; intake (sections in Step 2); §Package or library profile when nothing deploys |
| `references/retrospective.md` | After Release; Quick batch due |
| `templates/spec.md`, `ux.md`, `plan.md`, `acceptance-tests.md` | Specify; UX trigger; Design; acceptance-test design |
| `templates/pr-body.md`, `release-notes.md`, `retro.md`, `codemap.md`, `threat-model.md` | PR; Release; retro; brownfield adoption; risk-triggered spec |
| `templates/ops-record.md`, `postmortem.md`, `runbook.md` | Operate; SEV1/2 incident; operated-behaviour change |
| `references/module-index.md` | Scripts, CI templates, examples, upgrade, adoption, brownfield, extensions, `security-hardening` |

Script exit codes: `0` pass · `1` check failed · `2` input missing or unparsable · `3` bound reached, escalate. Node absent → the Markdown rules apply and `doctor` reports `enforcement: prompt-only`.

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

**1. Feature, Standard path.** "Add CSV export of order IDs, dates and totals to the reports page." S = 5, R = 1 (money) → Standard. AC-1..4, rollback = flag off, alert on export error rate > 2% over 15 min; combined Specify + Design sign-off (5 tasks); Build T1–T5 test-first; lenses L1–L4, GO; Test sign-off; Release 10% then 100%; retro within 5 business days. Files: `examples/worked-example/`.

**2. Bug, risk beats size.** "Sessions expire after 5 minutes instead of 30." S = 3 but R = 1 (auth) → Standard: short spec, combined approval, lens L3. With R = 0 it is Quick: acceptance test in the issue, lenses L1 + L2, Test sign-off.

**3. Resume.** "Continue the payments refactor." Step 0: spec rev 2 approved with a matching hash, plan approved, T1–T5 committed → "Resume Build at T6?"

**4. Change after approval.** "Product now wants Excel export too." The edit voids the Specify sign-off hash: change protocol (impact on AC-5, T6, tests), Revision 2, both sign-offs again, resume at Build.
