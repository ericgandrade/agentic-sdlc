---
name: spec-driven-development
description: This skill should be used when the user needs a written specification before code — turning an idea, brief, interview or conversation into specs/NNN-slug/spec.md with numbered acceptance criteria, non-goals, security notes, rollback, release and observability, and an indicator; validating a spec with spec-lint; revising an approved spec through the change protocol; or splitting a large initiative into module specs (the Specify stage and Specify sign-off of the Agentic SDLC).
license: MIT
---

# Spec-Driven Development

## Purpose

Write down what must be true when the work is done — before any code exists — so the human and the agents share one source of truth. The spec states the problem, numbered acceptance criteria (`AC-n`), non-goals, constraints, security notes, the rollback, how the change is released and observed, and the indicator that shows it worked.

This skill runs the **Specify** stage of the Agentic SDLC (Discover → Specify → Design → Build → Test → Release → Operate) and ends in the **Specify sign-off** by the Product Owner. The artifact is `specs/NNN-slug/spec.md`, written from `../agentic-sdlc/templates/spec.md` and checked by `spec-lint`. Once approved, the spec revision and its 12-hex hash are the build baseline: every task in `plan.md`, every commit, test and piece of evidence traces back to its `AC-n` IDs, and any later edit voids the approval until it is renewed.

In the method this skill is run by the **Analyst** (`../agentic-sdlc/agents/analyst.md`). Specialists join on their triggers (`../agentic-sdlc/references/agents.md` §Triggers):
- the **UX Designer** writes `ux.md` before Step 4, so every screen state becomes an AC or a named pattern, linked under `## Experience`;
- the **Product Manager** brief feeds Problem and Indicator, and its critique runs alongside Step 5;
- the **Security Auditor** fills Security notes when R ≥ 1.

Code without a spec is guessing; a spec without testable criteria is a wish.

## When to Use

- A Standard or Full path work item (path score in `../agentic-sdlc/references/paths.md`) is about to be built and no approved spec exists
- A brainstorming brief or a grill-me summary needs to become buildable requirements
- Requirements are scattered across a conversation, tickets or meeting notes
- An existing spec must be checked before the Specify sign-off request
- An approved spec must change (requirement change, defect in the spec, re-scored path)
- One request bundles several independently shippable capabilities

Not for Quick path work (score S ≤ 4 and R = 0): agree one acceptance test in the issue instead and go straight to Build. Escalate to this skill when a Quick item turns out to need more (`paths.md` §Escalate).

## Workflow

### Step 0 — Pick the mode and discover

| Mode | Use when | Ends with |
|---|---|---|
| **create** | Little written input; a short interview is required | Approved spec |
| **synthesize** | The conversation, brief or grill-me summary already holds the answers — no re-interview | Approved spec |
| **validate** | A spec exists and must be checked before approval | Findings table |
| **revise** | An approved spec must change | Revision N+1, re-approved |

Discover before asking. Read the issue (path score line and intake record from the Discover stage), the brainstorming brief or grill-me summary, `GLOSSARY.md`, `CONSTRAINTS.md` (Full path), ADRs in `docs/adr/`, the code map `docs/codemap.md` and the code the change touches. List `specs/` to pick the next number: `NNN` is the highest existing number plus one, three digits; `slug` is two to four kebab-case words.

If the project already uses a spec system (GitHub Spec Kit `specs/*/spec.md`, OpenSpec `openspec/changes/*/proposal.md`, Kiro `.kiro/specs/*/requirements.md`), keep its location and file name, and add the template's header table and sections to that file so `spec-lint` applies to it.

### Step 1 — Scope check

When the request bundles capabilities that have their own users or data and ship and verify separately (identity, billing, notifications), propose a **capability map** before any spec:

```markdown
| Module | Responsibility | Depends on |
|---|---|---|
| identity | Accounts, sessions, SSO | — |
| billing | Plans, invoices, payments | identity |
Build order: identity → billing
```

Module IDs are stable kebab-case names; dependencies point one way. Get the map approved, then write one spec per module in build order (`specs/014-identity/`, `specs/015-billing/`). Each module gets its own path score. Single-capability requests skip this step.

### Step 2 — Surface assumptions first

Before drafting, list the assumptions being made and invite correction:

```
ASSUMPTIONS:
1. Web app only, no native mobile
2. Existing session-cookie auth is reused
3. PostgreSQL via the current Prisma schema
→ Correct any of these now.
```

Never fill an ambiguity silently. An unstated assumption is the most expensive kind of misunderstanding. In create mode, ask the interview questions one round at a time, at most four independent questions per round, each with a recommended answer.

### Step 3 — Draft spec.md from the template

Copy `../agentic-sdlc/templates/spec.md` to `specs/NNN-slug/spec.md` and replace every `{{...}}` placeholder. Delete no section. The header table carries ID, Revision (starts at 1), Path, Size and Risk exactly as scored in Discover (`S=5 · files 2 + components 2 + iterations 1`, `R=1 · money`), Owner, Issue and the Intake decision (`n/a — <reason>` or `prior rejection #n — <why this differs>`).

Required sections, in template order:

1. **Problem** — who is affected, what fails today, and the evidence (ticket count, time lost, error rate)
2. **Users** — each actor with the permission or role that matters
3. **Stories** — "As a …, I want …, so that …"
4. **Acceptance criteria** — table `ID · Criterion · Priority`, `AC-1..n`, priority `critical` or `normal` (Step 4)
5. **Non-goals** — at least one bullet; carry over the brief's "Not doing" list
6. **Constraints** — *Always* / *Ask first* / *Never*, plus numeric limits (latency, size, volume)
7. **Security notes** — data classes, authentication and authorization, inputs, secrets; the Security Auditor fills or reviews this section when R ≥ 1
8. **Rollback** — the command, a verify command with its expected output, and what happens to data written while the change was live
9. **Release & observability** — signal tied to `AC-n`, alert with a numeric threshold and window plus the channel, dashboard or saved query, owner, rollout (flag default off, or staged percentages), rollback command
10. **Indicator** — name, baseline with a number and the date measured, numeric target, method, first reading date
11. **Open questions** — `None.` or each item marked `deferred: <owner>`
12. **Revision log** — one row per revision, with the critique result (Step 5)
13. **Approvals** — empty until the Specify sign-off; holds the `### Waivers` table

Never write a status ("Draft", "Approved") into the body. Status is derived from `## Approvals`: a valid row whose hash equals the current hash means approved. Writing a status would change the hash it records.

Keep the spec inside its word budget: 1,500 words on Standard, 3,000 on Full (comments, Revision log, Approvals and Open questions excluded). A Standard spec usually fits on one screen.

### Step 4 — Write acceptance criteria that can be proven

Each `AC-n` must be:

- **Observable** — behaviour or output someone can see or measure, not implementation ("uses Redis" is a design decision, not a criterion)
- **Testable** — a test or a command shows pass or fail without interpretation
- **Single** — one behaviour per criterion; split "and" statements
- **Bounded** — states the limits: sizes, roles, timeouts, error cases
- **Formatted** — `Given …, when …, then …`, or a measurable statement with a number and a unit (`p95 ≤ 3 s for 50,000 rows`)

Cover the unhappy paths, not just the happy one: invalid input, missing permissions, empty states, concurrency, partial failure, limits. Add non-functional criteria when they decide acceptance (p95 latency, accessibility level, data retention). Mark `critical` the criteria whose failure loses data, money or access control; the release gate and the acceptance tests treat them first.

Replace vague words with numbers in the same sentence. `spec-lint` flags terms such as *fast*, *scalable*, *user-friendly*, *robust*, *reliable*, *efficient*, *intuitive*, *large*, *many* unless a number with a unit follows in that sentence.

```
| AC-1 | Given a finance analyst viewing a report filtered to N rows (1 ≤ N ≤ 50,000), when they click Export CSV, then the file holds exactly N data rows with the columns order ID, order date and order total. | critical |
| AC-2 | Given a cell value starting with =, +, - or @, when the CSV is written, then the value is prefixed with a single quote. | critical |
| AC-3 | Given a user without reports:export, when they open the report, then no Export button is shown and GET /api/reports/export returns 403. | critical |
| AC-4 | Given a filter matching more than 50,000 rows, when Export CSV is clicked, then the user sees the limit message and no file is produced. | normal |
```

IDs are unique and contiguous from `AC-1`. A criterion removed in a later revision keeps its row and ID with the text `Retired in rev N: <reason>`; IDs are never reused.

### Step 5 — Independent critique and stop rule

After the draft and before lint, dispatch a **fresh-context critic** (and, when triggered, the Product Manager critique: problem–AC fit, scope creep, indicator measurability): a subagent that receives only `spec.md`, the brief or summary it was built from and this checklist — never the drafting conversation. When the host has no subagents, run the checklist as an explicit self-review in a new message and label it `self-review`. The critic answers each item with pass or a finding:

| # | Check |
|---|---|
| 1 | Would two engineers build different things that both satisfy every `AC-n`? |
| 2 | Is each criterion observable and decided by a test or command without interpretation? |
| 3 | Does each criterion state one behaviour, with its bounds (size, role, timeout, error)? |
| 4 | Are invalid input, missing permission, empty state, limits, concurrency and partial failure covered? |
| 5 | Is any criterion a design decision in disguise? |
| 6 | Do the non-goals block the nearest scope creep? |
| 7 | Are the data classes named, personal data excluded or protected, and all four security notes filled? |
| 8 | Is the rollback executable as written, with a verify command and a decision for data written while live? |
| 9 | Does release & observability name a signal per critical `AC-n`, a numeric alert with a window, an owner and a rollout? |
| 10 | Is the indicator measurable with tools that exist today, with a real baseline? |
| 11 | Is every vague word quantified and every number given a unit? |
| 12 | Does the path score match the content, and is every open question answered or deferred with an owner? |

**Material ambiguity** is a finding whose answer changes an AC outcome, the scope or the handling of data. On a material ambiguity, **STOP**: ask the Product Owner (or the owner named in the brief) in one round, with a recommended answer per question. Non-material findings are fixed directly in the draft.

**Stop rule.** At most **3 question rounds** per Specify pass. After the third round, each item still open becomes an Open questions entry `deferred: <owner>` when the build proceeds safely without it, or the stage ends with status `NEEDS_CONTEXT` (naming the missing input) and no approval request is made. An unanswered material ambiguity is never deferred silently.

Record the result in the Revision log row of the current revision, Critique column: `fresh-context · 12/12 · 3 fixed, 0 open` or `self-review · 12/12 · 2 fixed, 1 deferred`. `spec-lint` rejects a current revision without a critique entry of this form.

### Step 6 — Lint

Run `spec-lint` and fix every error before any approval request:

```bash
node .agentic-sdlc/bin/spec-lint.mjs specs/NNN-slug/spec.md              # vendored copy (project-context)
node <agentic-sdlc skill dir>/scripts/spec-lint.mjs specs/NNN-slug/spec.md  # when nothing is vendored
```

| Exit | Meaning | Next action |
|---|---|---|
| 0 | All rules pass (warnings listed) | Proceed to the approval request; carry warnings into Residual risks |
| 1 | Rule failures, each with a rule ID and line | Fix, re-run; never request approval on exit 1 |
| 2 | File missing or not built from the template | Start from `templates/spec.md` |

The rules cover the header and routing (a path lower than the score is an error — never route down), placeholders, required sections, AC numbering and form, non-goals, security notes, rollback, release and observability (numeric alert threshold, AC-tagged signal, flag or staged rollout, rollback command), indicator, open questions, revision log and critique, vague terms, word budget, threat model presence (required on Full; a warning on Standard with a risk trigger) and waivers.

Without Node, apply the same rules by hand from the template comments and paste the checklist result into the request (`../agentic-sdlc/references/platforms.md` §4).

### Step 7 — Specify sign-off

Follow `../agentic-sdlc/references/governance.md` §2 exactly:

1. Print the hash: `spec-lint --hash specs/NNN-slug/spec.md`.
2. Present one message: path, revision, hash, the lint result, the critique summary, the residual risks, and one question to the named role — `Product Owner: approve spec.md rev 1 (hash 2aef8f23fc84) as the build baseline? Reply "yes" or list changes.`
3. Log the request in `specs/NNN-slug/approvals.md` (Requested at, Asked role).
4. **End the turn.** Do not start Design in the same turn.
5. In a later turn, count only an explicit `yes` / `approve` / `approved` that lists no changes. "Sounds good" about something else, silence, "whatever you think" or an agent statement is never approval. A reply that mixes yes with changes is a rejection: apply the changes as a new revision and ask again.
6. Record the row in `## Approvals` (Sign-off, Rev, Hash, Date, Role, Person, Exact words, Evidence reviewed, Residual risks, Decision) and complete the register row (Answered at, Exact words).
7. Confirm with `spec-lint --check-approval specs/NNN-slug/spec.md` (exit 0).

**Combined review (Standard path, plan with ≤ 5 tasks).** Fix the spec hash first, hand off to `writing-plans` for `plan.md`, then send one request covering both artifacts. Record the row `Specify + Design (combined)` in each artifact and one register row per artifact. On the Full path the Specify and Design sign-offs are separate requests (`paths.md` §3).

Hand off: `senior-solution-architect` when a decision is expensive to reverse (ADR), then `writing-plans` (Design stage).

### Validate mode

Run Steps 4, 5 and 6 against an existing spec and report a findings table — section, rule ID or checklist item, issue, severity (`Critical` / `Important` / `Minor`), concrete fix. Do not rewrite the spec without the owner's approval of the findings.

### Revise mode — revision hash and re-open rule

Any edit to the hashed content of an approved spec — an AC, a non-goal, the rollback, the alert threshold, a typo — changes its hash and **voids** the approval. `spec-lint --check-approval` then exits 1 with `AP04`, so `preflight` stops Build and the CI check `agentic-sdlc/spec` turns red. Run the change protocol (`../agentic-sdlc/references/rules.md` §Change protocol):

1. Stop the current Build task at the next green test run.
2. Write the change request as a new Revision log row: what changed, why, who asked, date.
3. Analyse the impact on `AC-n`, tasks, tests, ADRs, rollback, indicator and the path score; route up when the score rises.
4. Edit the spec as revision N+1: bump the header Revision, retire (never delete or renumber) removed criteria, add new IDs after the last one.
5. Run the critique (Step 5) on the changed sections and `spec-lint` (Step 6).
6. Request Specify sign-off again (Step 7); the new row carries rev N+1 and the new hash, and earlier rows stay as history. A void Specify sign-off also voids the Design sign-off built on that spec hash: request Design sign-off again when any task, file set or dependency changed.

Recording an approval or a waiver does not change the hash: the `## Approvals` section and its `### Waivers` subsection are excluded from it.

## Critical Rules

- **NEVER** start or allow Build before a valid Specify sign-off on the Standard and Full paths; `spec-lint --check-approval` exit 0 is the evidence.
- **NEVER** request approval on `spec-lint` exit 1, or count a reply given in the same turn as the request.
- **NEVER** fill an ambiguity silently; a material ambiguity stops the draft until it is answered or deferred with an owner.
- **NEVER** run more than 3 question rounds per Specify pass; then defer with an owner or report `NEEDS_CONTEXT`.
- **NEVER** edit an approved spec without a new revision and a new approval request.
- **NEVER** write implementation details as acceptance criteria, or a status line into the spec body.
- **NEVER** route down: the header path is at least the scored path.
- **ALWAYS** number criteria `AC-n`, contiguous and stable; retire, never reuse, removed IDs.
- **ALWAYS** fill Release & observability with a numeric alert threshold, an AC-tagged signal and an executable rollback command.
- **ALWAYS** cover unhappy paths and permissions in the criteria.
- **ALWAYS** keep real personal, health or client data out of the spec and its examples.
- **ALWAYS** keep an existing spec system's location and add the template's header and sections to it.

## Example Usage

**1. Synthesize from a grill-me summary**
> "We agreed the export design in grill-me — write the spec."

Synthesize mode, no re-interview. Lists three assumptions, drafts `specs/001-csv-export/spec.md` with AC-1..AC-4 (filtered rows, formula-injection escaping, 403 without permission, 50,000-row limit), rollback by `flagctl set reports.csvExport off --env prod` with a verify command, alert "error rate > 2% over 15 min → #reports-oncall", indicator "export tickets 14/month → ≤ 4/month". The fresh-context critic fixes three items; `spec-lint` exits 0 with one threat-model warning for the money trigger. The plan has five tasks, so one combined Specify + Design request goes out and the turn ends. The Product Owner's "Yes — approved" arrives in the next turn and is recorded with the hash. Full worked example: `../agentic-sdlc/examples/worked-example/specs/001-csv-export/`.

**2. Create with a stop on ambiguity**
> "Write a spec for password reset via email."

Round 1 asks token lifetime, rate limit and session handling, each with a recommendation. The critic flags "what happens to active sessions after reset" as material (it changes AC-5's outcome); round 2 settles it. The email provider's sender domain stays unanswered after round 3 and is recorded as `deferred: Tech Lead`, since the build proceeds safely without it.

**3. Large initiative**
> "Spec the new customer portal: login, billing, notifications and usage reports."

The scope check produces a capability map with four modules and a build order. After the map is approved, `specs/014-identity/spec.md` is written first and scored Full (R=2: auth, personal data), so `threat-model.md` is required before lint passes.

**4. Validate before approval**
> "Check this spec before we approve it."

`spec-lint` exits 1: `V01` "fast" unquantified in AC-2, `OBS03` alert "errors are high" has no threshold, `OQ01` an open question without an owner. The checklist adds item 8: the rollback drops a column without a data decision. Reports four findings with concrete rewrites and leaves the spec unchanged.

**5. Requirement change after approval**
> "Product now wants an XLSX export too."

Revise mode. Writes the change request in the Revision log, re-scores (still Standard), retires nothing, adds AC-5 and AC-6, bumps Revision to 2, re-runs the critique and `spec-lint`. `--check-approval` reports `AP04` until the Product Owner approves rev 2; the Design sign-off is requested again because two tasks change.
