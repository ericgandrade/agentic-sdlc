# Agentic SDLC — The Lifecycle

The Agentic SDLC follows the standard software development life cycle with AI agents: **7 stages, 4 human sign-offs, 13 agents named by function (`references/agents.md`), 3 paths sized by risk.** Agents execute; named human roles approve. Every work item runs Discover → Specify → Design → Build → Test → Release → Operate, and Operate feeds the next Discover.

```
Stage      Lead agent (helpers on triggers)        Ends with                          Human sign-off
Discover   Analyst (Product Manager)               path score + intake record         —
Specify    Analyst (PM, UX Designer, Sec. Auditor) specs/NNN-slug/spec.md (+ ux.md)   Specify sign-off  · Product Owner
Design     Planner (Architect)                     plan.md + graph.json + ADRs        Design sign-off   · Tech Lead
Build      Developer (Tech Writer)                 commits + PR (DoD green)           —   (bounded loops, references/loops.md)
Test       Reviewer (Test Eng., Sec. Aud., UX)     PR Verification/Trace/Triage       Test sign-off     · human reviewer (engineer)
Release    Release Engineer (Tech Writer)          release notes + rollback rehearsal Release sign-off  · Release Owner
Operate    SRE (Product Manager)                   ops record, postmortems, retro     On-call engineer owns incidents
All        Scrum Master (the router)               progress line, impediments, retro  —
   └──────── incidents, indicator misses, retro actions → new items in Discover ────┘
```

Review is not a stage: independent review runs inside Test and ends in Test sign-off. Unit tests are written in Build (test-first); Test verifies the change against the spec.

## 1. Stages

| Stage | Entry condition | Work (procedure) | Exit record | Failure behaviour |
|---|---|---|---|---|
| **Discover** | A request, issue, incident action or retro action exists | Search the tracker and `specs/` for duplicates and prior rejections (by domain noun + verb); classify as bug, task, story or epic; score the path (§3); name the indicator (baseline + target), from the Product Manager brief when triggered | Score line in the issue or spec header: `Path: Standard · S=5 · R=1 (money)`; intake record | Duplicate found → link it, propose `duplicate`; the Product Owner confirms the intake decision, then stop. Path inputs missing → Standard |
| **Specify** | Path is Standard or Full | Analyst drafts `spec.md` from `templates/spec.md`; UX Designer writes `ux.md` when a user-facing surface changes; Product Manager critique and a fresh-context critic (12-item checklist, max 3 question rounds); Security Auditor fills Security notes when R ≥ 1; `spec-lint` runs | `spec.md` with AC-1..n, Release & observability, Approvals | Lint exit 1 → fix before asking for approval. 3 rounds without an answer → `NEEDS_CONTEXT`, no approval request |
| **Design** | Specify sign-off valid (hash matches) | Architect writes ADRs for decisions that are expensive to reverse; Planner writes `plan.md` tasks (≤ 1 day each, ≥ 1 AC each, `Blocked by`, `Files`; UX states and docs mapped to tasks); `plan-graph` builds waves | `plan.md`, `graph.json`, ADRs `docs/adr/NNNN-*.md` | Cycle or unknown task ID → `plan-graph` exit 1 → no approval request |
| **Build** | Design sign-off valid; preflight green | Developer takes tasks in graph order, one task per fresh context: red (paste failing output) → green → refactor; commit with trailer `Refs: T3 AC-2`; DoD gate before opening the PR | Commits, PR from `templates/pr-body.md`, evidence records | Loop bound hit → `ESCALATE` (§5). File outside the plan's `Files` → stop and re-plan |
| **Test** | PR open, DoD green | Test Engineer's acceptance tests (designed from the spec, never from the diff) run; Reviewer runs lenses L1–L4 (Quick: L1 + L2), verifies each finding, fills Verification, Trace and Review triage | PR sections complete; verdict GO / NO-GO | Default verdict NO-GO until every AC has fresh evidence and 0 Critical findings are open |
| **Release** | PR approved and merged; production change | Release Engineer runs the release checklist: rollback rehearsed in staging, flag defaults off, test alert fired once, go/no-go criteria | Release notes with AC-n list, rehearsal output, runbook link | Any checklist item false → NO-GO; no Release sign-off request |
| **Operate** | Released | SRE watches the spec's alert and indicator; first indicator reading ≤ 7 days after release; incidents by severity; postmortems; retro | `specs/NNN/ops.md`, `docs/postmortems/`, `docs/retros/` | SEV1/2 → incident procedure (`references/release-ops.md`); indicator miss → new Discover item labelled `from-production` |

Quick path: Discover → Build → Test → (Release when production deploys) → Operate. The Analyst scores the path and writes the acceptance test in the issue before code; there is no `spec.md` and no Design sign-off.

## 2. The four sign-offs

| Sign-off | Stage end | Default role | Recorded in | Bound to |
|---|---|---|---|---|
| **Specify sign-off** | Specify | Product Owner | `spec.md` → `## Approvals` | spec revision + 12-hex hash |
| **Design sign-off** | Design, before code | Tech Lead | `plan.md` → `## Approvals` | plan revision + hash + spec hash it was built on |
| **Test sign-off** | Test | human reviewer (engineer) | Pull request review | head commit SHA |
| **Release sign-off** | Before production | Release Owner | Release notes → `## Approval` | release tag + rehearsal output |

**Procedure (every approval).** Present the artifact, the evidence reviewed and the residual risks; ask for an explicit decision; end the turn. Only an explicit "yes" (or "approved") in a later turn counts. Silence, "sounds good" about something else, and "whatever you think" are not approval.

**Record fields:** sign-off · rev + hash · date · role · person · exact words · evidence reviewed · residual risks · decision (approved / approved with conditions / rejected). Full rules: `references/governance.md`.

**Hash rule.** The hash is the first 12 hex characters of SHA-256 over the file body (`scripts/lib/md.mjs` `contentHash`). The spec hash excludes `## Approvals`; the plan hash excludes `## Approvals` and `## Loop ledger`, so ledger rows appended during Build never void the Design sign-off. Any other later edit changes the hash and voids the approval; the change protocol in `references/rules.md` runs. `spec-lint --hash` and `plan-graph` (`planHash`) print the values to record.

**Intake decision.** Required when Discover finds a duplicate or a prior rejection; otherwise recorded as `n/a — <reason>` in the issue.

**Roles.** One person can hold several roles; the record names the role exercised. Approver ≠ PR author is enforced by `approval-check` (mechanism 10.4); in a 1-person team the waiver procedure in `references/governance.md` applies.

**Enforcement.** Branch protection with ≥ 1 review, CODEOWNERS on `specs/**`, required checks `agentic-sdlc/{dod,spec,trace,approvals}`, and a `production` environment with required reviewers. A host without these features → `doctor` reports `enforcement: prompt-only` and the PR carries that banner.

## 3. Paths

| Path | Typical item | Approvals | Required artifacts |
|---|---|---|---|
| **Quick** | Bug, small task | Test (+ Release when production deploys) | Issue with acceptance test; PR with Verification; retro batched |
| **Standard** | Story, feature | Specify + Design (one combined review when the plan has ≤ 5 tasks; otherwise two), Test, Release | `spec.md`, `plan.md`, `acceptance-tests.md`, PR, release notes, retro record |
| **Full** | Epic, high-risk, regulated, brownfield modernization | All four separately + a second human reviewer on the Test sign-off (PR) | Standard set + ADRs, `threat-model.md`, `CONSTRAINTS.md`, runbook, full retro |

**Score (mechanism 14.2).** Size S = files (≤ 3: 1 · 4–15: 2 · > 15: 3) + components (1 · 2 · ≥ 3 → 1/2/3) + iterations (1 · 2 · ≥ 3 → 1/2/3). Risk R = count of triggers: auth, personal/health data, money, public API, schema/migration, irreversible, regulated. Size route: S ≤ 4 Quick, 5–6 Standard, ≥ 7 Full. Risk route: R = 0 Quick, R = 1 Standard, R ≥ 2 **or** personal/health data **or** irreversible → Full. **Path = the higher of the two routes.**

**Escalation.** In Build, touching more files than the path bound (Quick > 3, Standard > 15) or meeting a new trigger → stop, re-score, re-route up, log a Revision entry. Never route down silently. Detail and worked cases: `references/paths.md`.

**Combined review record (Standard, ≤ 5 tasks).** One record names both revisions and both hashes; the spec hash is fixed before the plan is presented.

## 4. Every requirement is proven

The ID chain (mechanism 9.1):

```
spec AC-n → plan task Tn (lists AC-n) → commit trailer "Refs: Tn AC-n" → test name contains AC-n
  → PR Verification row (AC-n · test · command · exit · fingerprint · time) → release notes AC-n list
  → ops record indicator reading / incident tagged AC-n or spec ID
```

Gap analysis runs both ways before Test sign-off: every AC has ≥ 1 task and ≥ 1 passing test; every task has an AC; every commit on the branch has a Tn. An orphan → PR NO-GO (`references/verification.md` §Trace).

## 5. Loops and their bounds

| Loop | Exit | Bound | At the bound |
|---|---|---|---|
| Red-green | target test green | 3 failed attempts | enter the debug loop |
| Build-test fix | DoD + AC tests green | 5 rounds per task | `ESCALATE` to the Tech Lead |
| Review-fix | 0 open Critical findings | 3 review rounds | `ESCALATE` to the Tech Lead |
| Debug | root cause proven by a test | 3 refuted hypotheses | `ESCALATE` to the Architect |

Anti-thrash: the same failure signature in 2 consecutive rounds, or 3 failed fixes on one task → stop fixing and open a design question for the Architect. Root-cause routing: spec → Specify (voids Specify sign-off), design/plan → Design (voids Design sign-off), code/test → Build, env → preflight. Unknown cause after 2 rounds → treated as design. Detail: `references/loops.md`.

## 6. Release and Operate rules that start earlier

- **Observability is defined in Specify, not Operate.** `spec.md` §Release & observability names the signal, an alert with a numeric threshold, the dashboard or query location, the owner, the rollout (flag or stages 1% → 10% → 100%) and the rollback command. Required on Standard/Full by `spec-lint`; on Quick with a production deploy, one line: signal + rollback command.
- **Runbook.** Required whenever a change alters operated behaviour (new endpoint, job, config or alert) on any path; always on Full.
- **Retrospective.** Standard/Full: within 5 business days after Release (after merge when there is no release), ≤ 15 minutes, ≥ 1 owned action that changes a file. Quick: batched every 10 merged items or 14 days, whichever comes first. Overdue → the next step `status.mjs`† reports.

## 7. Operate → Discover

Every incident action, postmortem action, alert trend and indicator miss becomes an issue labelled `from-production` with the spec or AC ID, triaged in Discover within 2 business days. An incident whose AC is unknown links to the spec ID and is marked `untraced-requirement`.

† Added in a later release; manual fallback in `references/artifacts.md` §Later-release files.
