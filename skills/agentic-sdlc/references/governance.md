# Agentic SDLC — Governance: Approvals, Revisions and Waivers

Load this file for any approval request, any approval record, any waiver, and the enforcement setup. It implements mechanisms **10.1** (approval records), **2.3** (revision hash and re-open rule), **10.3** (waivers) and states **10.2** (risk-scaled depth, procedure in `references/paths.md` §3). Rule 3 of `references/rules.md` ("Humans approve, agents execute") governs; this file is its procedure.

## 1. The four sign-offs and their owners

**Sign-off** — a recorded human approval that closes a stage: Specify, Design, Test and Release sign-off. Specify and Design sign-offs are rows in the `## Approvals` section of `spec.md` and `plan.md`; the Test sign-off is the approving PR review (no PR host: the `## Test sign-off` row of the review record, `templates/pr-body.md`); the Release sign-off is the `## Approval` section of the release notes. Each sign-off is named after the stage it closes.

| Sign-off | Owner role (decides) | Artifact | Bound to | Binding record | Deterministic check |
|---|---|---|---|---|---|
| **Specify** | Product Owner | `specs/NNN-slug/spec.md` | spec rev + 12-hex hash | `spec.md` → `## Approvals` | `spec-lint --check-approval` |
| **Design** | Tech Lead | `specs/NNN-slug/plan.md` | plan rev + hash + the spec hash it was built on | `plan.md` → `## Approvals` | `plan-graph --check-approval` |
| **Test** | Human reviewer (engineer, not the PR author) | Pull request | head commit SHA (PR host); no PR host → evidence fingerprint (`references/verification.md` §4; record files excluded) | PR review on the host; no host → `## Test sign-off` row in `specs/NNN-slug/review.md` (Quick: `docs/reviews/<issue>.md`) | branch protection; `approval-check --pr`† (10.4) |
| **Release** | Release Owner | Release notes | release tag + rehearsal output | release notes → `## Approval` | release checklist (`references/release-ops.md`) |

Every request is also logged in the register `specs/NNN-slug/approvals.md` (§3). Quick-path items have no `specs/` folder.

**Test sign-off staleness.** With a PR host, a push after the request makes the request stale (the review binds to the head SHA). Without a PR host, the sign-off binds to the fingerprint, so committing the review record does not stale it; any change to code or tests changes the fingerprint and voids it.

**Accountability roles (K12).** One person can hold several roles; every record names the role exercised. Approver ≠ PR author is enforced by `approval-check`† (mechanism 10.4); in a 1-person team the waiver procedure (§6) applies.

| Role | Accountable for | Never |
|---|---|---|
| Product Owner | Scope, AC-n, non-goals, indicator; Specify sign-off | Approves the plan's technical choices alone |
| Tech Lead | Tasks, ADRs, dependencies, loop escalations; Design sign-off | Approves a plan built on a void spec hash |
| Human reviewer | Test sign-off after reading Verification, Trace and Review triage | Approves a PR they authored |
| Release Owner | Go/no-go, rollout, rollback; Release sign-off | Approves without the rehearsal output |
| Waiver owner | The accepted risk until the expiry date | Owns a waiver they requested (except §6.3) |
| On-call engineer | Destructive production actions the SRE drafts | Runs an action the SRE has not drafted and logged |
| UX Lead *(optional)* | Consulted on `ux.md` on Full; may be the Product Owner's delegate for UX questions | Signs off in place of the Product Owner |
| Scrum Master *(optional human)* | Runs the retro meeting; removes impediments outside the repository | Approves, waives or sets scope |

### RACI per stage

R = does the work (agents) · A = accountable, holds the sign-off (one human) · C = consulted · I = informed. Agent roles: `references/agents.md`. Specialists appear only when their trigger fires.

| Stage | R | A | C | I |
|---|---|---|---|---|
| Discover | Analyst, Product Manager | Product Owner | Scrum Master | Tech Lead |
| Specify | Analyst (spec), UX Designer (`ux.md`), Security Auditor (security notes, compliance) | Product Owner — Specify sign-off | Product Manager (critique), UX Lead, Tech Lead | Test Engineer |
| Design | Planner, Architect | Tech Lead — Design sign-off | UX Designer, Security Auditor | Product Owner |
| Build | Developer, Tech Writer (docs task) | Tech Lead | Architect (escalations) | Scrum Master |
| Test | Reviewer, Test Engineer, Security Auditor (L3), UX Designer (UX checks) | Human reviewer — Test sign-off | Tech Lead | Product Owner |
| Release | Release Engineer, Tech Writer (user section) | Release Owner — Release sign-off | SRE | Product Owner |
| Operate | SRE, Product Manager (indicator) | On-call engineer | Scrum Master (retro) | Everyone on the item |

## 2. Approval procedure (10.1)

**Trigger:** an artifact reaches its exit record (`references/lifecycle.md` §1) and its check exits 0 (`spec-lint`, `plan-graph`, PR verdict GO, release checklist all true).

1. **Pre-check.** Run the artifact's check. Exit ≠ 0 → no request; fix or report `BLOCKED`.
2. **Hash.** `node .agentic-sdlc/bin/spec-lint.mjs --hash specs/NNN-slug/spec.md` prints the hash to record.
3. **Request.** Present, in one message: artifact path, rev, hash, the evidence reviewed (lint output, critique summary, test output), the residual risks, and one question naming the role: `Product Owner: approve spec.md rev 1 (hash 6b4c7f329c93) as the build baseline? Reply "yes" or list changes.`
4. **Log the request** as a new row in `approvals.md` with `Requested at` (UTC, minute precision) and the asked role.
5. **End the turn.** No further tool call, no work on the next stage.
6. **Read the reply in a later turn.** Count it as approval only when it contains an explicit `yes`, `approve` or `approved` and names nothing to change. Record the decision:
   - `approved`
   - `approved with conditions` (conditions go in Residual risks, each with an owner)
   - `rejected` (changes listed → new revision)
7. **Record** the row in the artifact's `## Approvals` and fill `Answered at` and `Exact words` in `approvals.md`.

| Counts as approval | Never counts |
|---|---|
| "yes", "approved", "I approve rev 2", "yes, go ahead with the plan" | Silence or no reply · "sounds good" about another topic · "whatever you think" · "probably fine" · an emoji · approval given in the same turn as the request · approval by a role other than the one asked · an agent's own statement |

**Failure behaviour.** No explicit yes → `preflight` and router Step 0 report `BLOCKED: approval missing`. A reply mixing yes and changes → `rejected`; apply the changes as a new revision and request again.

## 3. Record formats

**Approval row.** Each file uses its own form, taken from its template. `spec.md` binds one artifact, so it has one `Rev` and one `Hash` column (`templates/spec.md`):

| Sign-off | Rev | Hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|
| Specify + Design (combined) | 1 | 6b4c7f329c93 | 2026-11-23 14:40 | Product Owner | L. Rocha | "Yes — approved: spec rev 1 and plan rev 1 as presented." | spec-lint exit 0; critique 12/12; plan-graph exit 0 (plan rev 1) | Export error alert untested until staging | approved |

`plan.md` binds the plan and the spec it was built on, so it replaces `Rev`/`Hash` with `Plan rev`, `Plan hash`, `Spec rev` and `Spec hash` (`templates/plan.md`):

| Sign-off | Plan rev | Plan hash | Spec rev | Spec hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Specify + Design (combined) | 1 | 4da2f0c5aea8 | 1 | 6b4c7f329c93 | 2026-11-23 15:10 | Tech Lead | D. Okafor | "Approved. Plan rev 1, five tasks, go." | plan-graph exit 0; spec-lint exit 0; critique 12/12 | Export error alert untested until staging | approved |

Parsers: `spec-lint --check-approval` reads the spec form; `plan-graph --check-approval` requires the plan form's columns (`Sign-off`, `Plan rev`, `Plan hash`, `Spec hash`, `Role`, `Person`, `Exact words`, `Decision`) and exits 1 with `APPROVAL_COLUMNS` otherwise; `preflight` and `run-ledger start` accept both forms (named hash columns, or the hash in the row text of the spec form).

Field rules checked by `spec-lint --check-approval`: Sign-off is `Specify` or `Specify + Design (combined)`; Rev equals the header Revision; Hash equals the current hash; Date is `YYYY-MM-DD[ HH:MM]` (UTC); Role, Person, Evidence reviewed, Residual risks non-empty (`none` is a value); Exact words contain an explicit yes; Decision is `approved` or `approved with conditions`. Rows are append-only: earlier rows stay as history, and the **last** Specify row binds.

**Approval register** (`specs/NNN-slug/approvals.md`, required on Standard and Full):

| Req | Sign-off | Artifact | Rev | Requested at | Asked role | Answered at | Exact words | Record |
|---|---|---|---|---|---|---|---|---|
| R1 | Specify + Design (combined) | spec.md | 1 | 2026-11-23 10:05 | Product Owner | 2026-11-23 14:40 | "Yes — approved: …" | spec.md ## Approvals row 1 |

`spec-lint --check-approval` requires a register row for `spec.md` at the approved rev with `Answered at` later than `Requested at` (the later-turn rule), the same date as the approval row, the same exact words and the same role. Any mismatch → exit 1.

**Combined review (Standard, ≤ 5 plan tasks, K8).** One request covers both artifacts. The spec hash is fixed before the plan is presented. Each artifact gets its own row: in `spec.md` with the spec rev + hash, in `plan.md` with both revs and both hashes, and one register row per artifact with the role asked for it.

## 4. Revision hash and re-open rule (2.3)

- **Hash.** First 12 hex characters of SHA-256 over the file with the `## Approvals` section (and its `### Waivers` subsection) removed, line endings normalized to LF, trailing newlines trimmed (`scripts/lib/md.mjs` `contentHash`). `plan.md` also excludes `## Loop ledger`.
- **Status is derived, never written.** "Approved" means: the last approval row's hash equals the current hash. Writing a status into the body would change the hash.
- **Trigger.** Any edit to the hashed content after approval: an AC, a non-goal, the rollback, the alert threshold, a typo.
- **Rule.** Hash differs → the approval is **void**. Run the change protocol (`references/rules.md` §Change protocol): impact on AC-n, tasks and tests → Revision N+1 with a Revision log row and a new critique → `spec-lint` → a new request → a new row. A void Specify sign-off also voids the Design sign-off built on that spec hash.
- **Output.** Revision log row + new approval row; both old rows stay.
- **Failure behaviour.** `spec-lint --check-approval` exits 1 with rule `AP04` (`approval void: recorded hash X ≠ current Y`). `preflight` runs it before Build and CI runs it on every change to `specs/**/spec.md`, so Build stops and the PR check is red until re-approval.

## 5. Approval depth by risk (10.2)

| Path | Specify | Design | Test | Release |
|---|---|---|---|---|
| Quick | — (acceptance test in the issue) | — | 1 human reviewer | Release Owner, only when production deploys |
| Standard | Product Owner | Tech Lead; one combined review when the plan has ≤ 5 tasks, otherwise two | 1 human reviewer | Release Owner |
| Full | Product Owner, separate review | Tech Lead, separate review | 2 human reviewers, ≥ 1 not involved in Design | Release Owner, after the rehearsal output is attached |

Path selection and escalation: `references/paths.md`. Escalating up during Build requires the approvals of the new path before Build resumes.

## 6. Waivers (10.3)

**Trigger:** proceeding despite a failed gate (lint, DoD, review finding, release checklist item, coverage floor, missing approval in a 1-person team).

### 6.1 Kinds and bounds

| Kind | Use | Max expiry | Severity allowed |
|---|---|---|---|
| `accept-risk` | Ship with a known Important or Minor gap | 30 days | Important, Minor |
| `defer` | Move an item to a follow-up issue | 30 days | Important, Minor |
| `emergency` | Restore service during an incident before the normal approval | 7 days; retroactive normal approval ≤ 2 business days | any, including Critical |

A Critical item is never waived by `accept-risk` or `defer`.

### 6.2 Record

Table `### Waivers` inside `## Approvals` of the affected spec (so recording it does not change the spec hash), or `## Waivers` in the PR body or release notes for gates that live there:

| ID | Kind | Gate waived | Severity | Reason | Requester | Owner | Granted | Expires | Follow-up |
|---|---|---|---|---|---|---|---|---|---|
| W1 | accept-risk | DoD coverage 77.9 < 78.4 | Important | Generated client excluded next sprint | Developer (agent) | Tech Lead · J. Park | 2026-11-24 | 2026-12-08 | #418 |

Rules (`spec-lint` rules WV01–WV05): kind is one of the three; gate and reason non-empty; owner ≠ requester; expiry ≥ granted and within the kind's maximum; follow-up is `#n`, `KEY-n` or a URL. The owner gives the waiver with the same explicit-yes procedure as an approval (§2).

### 6.3 One-person team

The owner is written `self · 1-person team`; the decision is taken in a later session at least 12 hours after the request, and the PR banner shows `self-approved under waiver W<n>`.

**Failure behaviour.** A malformed waiver → `spec-lint` exit 1. An expired waiver → `spec-lint --check-approval` exit 1 (`WV05`), Release go/no-go item R8 false, and `approval-check`† FAIL once CI is installed. Renewal is a new row, never an edited date.

## 7. Enforcement (K5)

| Control | Setting | Blocks |
|---|---|---|
| Approval gate before Build | `preflight` runs `spec-lint --check-approval` and `plan-graph --check-approval` | Build start on a missing or void approval (exit 1) |
| CI check `agentic-sdlc/spec` | `spec-lint --check-approval` on every PR that changes `specs/**` or code under a spec | Merge, when the check is required |
| Branch protection | ≥ 1 approving review; dismiss stale reviews; required checks `agentic-sdlc/{dod,spec,approvals}` (`trace` once `trace-check`† ships; until then the Reviewer checks the PR Trace section) | Merge without Test sign-off or with a red check |
| CODEOWNERS | `specs/** @tech-leads @product-owners` | Spec or plan edits without an owner's review |
| Environment reviewers | GitHub `production` environment with the Release Owner as required reviewer | Deploy without Release sign-off |

**Failure behaviour.** A host or plan without one of these controls → the doctor† reports WARN per missing control, the AGENTS.md block records `Enforcement: prompt-only`, and every PR body starts with the banner `enforcement: prompt-only — approvals are not system-enforced on this repository`. The approval gate in `preflight` still runs wherever Node ≥ 18 exists.

† Added in a later release; manual fallback in `references/artifacts.md` §Later-release files.

## Sources

Approval-with-re-read and baseline revisions adapt BMad Method (MIT); the hard gate before code adapts Superpowers (MIT). Waiver kinds and risk-scaled approval depth use Agile V concepts, rewritten in original text.
