---
name: spec-driven-development
description: This skill should be used when the user needs a written specification before code — turning an idea, brief, interview or conversation into specs/NNN-slug/spec.md with numbered testable acceptance criteria, measurable non-functional requirements, non-goals, security notes, rollback, release and observability, and an indicator; validating a spec with spec-lint and a doubt pass; revising an approved spec with a delta that states what must not change; splitting an epic into a capability map of module specs; or importing Spec Kit, Kiro, OpenSpec or AI-DLC specs (the Specify stage and Specify sign-off of the Agentic SDLC). Not for exploring options before the problem is agreed (use brainstorming), the threat model (use security-hardening), plan tasks (use writing-plans), or deciding where a change re-enters the cycle (use agentic-sdlc).
license: MIT
---

# Spec-Driven Development

## Purpose

Agentic SDLC · Specify stage. Agents: **Product Manager** (problem, stories, indicator), **Analyst** (acceptance criteria, doubt pass, lint), **UX Designer** (`ux.md` when a user-facing surface changes). The **Product Owner** signs off — a human, never an agent.

Write down what must be true when the work is done — before any code exists — so humans and agents share one source of truth: the problem, numbered acceptance criteria (`AC-n`), non-goals, constraints, security notes, the rollback, release and observability, and the indicator that shows it worked.

The artifact is `specs/NNN-slug/spec.md`, written from `../agentic-sdlc/templates/spec.md` and checked by `spec-lint`. Once approved, the spec revision and its 12-hex hash are the build baseline: every task in `plan.md`, every commit, test and piece of evidence traces back to its `AC-n` IDs (`../agentic-sdlc/references/lifecycle.md` § 4), and any later edit voids the approval until it is renewed (`../agentic-sdlc/references/governance.md` § 4).

Role briefs: `../agentic-sdlc/agents/analyst.md`, `product-manager.md` (its critique — problem–AC fit, scope creep, indicator measurability — runs alongside Step 6), `ux-designer.md` (`ux.md` before ACs are final). The Security Auditor fills Security notes when R ≥ 1 and writes `threat-model.md` on Full or risk-flagged items (`../agentic-sdlc/references/agents.md` § Triggers).

Code without a spec is guessing; a spec without testable criteria is a wish.

## When to Use

- A Standard or Full work item (score in `../agentic-sdlc/references/paths.md` § 2) is about to be built and no approved spec exists
- A brainstorming brief, Product Manager brief or grill-me summary must become buildable requirements
- Requirements are scattered across a conversation, tickets or meeting notes
- Acceptance criteria or quality words ("fast", "secure") must become testable
- A spec must be checked before the Specify sign-off request
- An approved spec must change (requirement change, spec defect, re-scored path)
- An epic bundles several independently shippable capabilities
- The repository already holds Spec Kit, Kiro, OpenSpec or AI-DLC specs that must join the method

**When not to use.** Quick path work (S ≤ 4 and R = 0) has no `spec.md`: agree 1–3 acceptance criteria and the rollback line in the issue and go to Build; escalate here when a Quick item grows (`paths.md` § 4). Neighbors:

| Need | Skill |
|---|---|
| Explore options before the problem is settled | `brainstorming` |
| Stress-test a design or plan by interview | `grill-me` |
| Classify, de-duplicate and score an incoming item (Discover) | `issue-triage` |
| Record an expensive-to-reverse decision (ADR) | `senior-solution-architect` |
| Turn an approved spec into tasks (Design) | `writing-plans` |
| Design the acceptance tests from the approved spec | `test-strategy` |
| Threat model, secrets, dependency review | `security-hardening` |
| Set up `GLOSSARY.md`, `CONSTRAINTS.md`, vendored scripts | `project-context` |

## Workflow

### Step 0 — Pick the mode and discover

| Mode | Use when | Ends with |
|---|---|---|
| **create** | Little written input; a short interview is required | Approved spec |
| **synthesize** | The conversation, brief or grill-me summary already holds the answers — no re-interview | Approved spec |
| **validate** | A spec exists and must be checked before approval | Findings table |
| **revise** | A spec must change after a sign-off request or approval | Revision N+1, re-approved |

Discover before asking. Read the issue (score line, intake record), the Product Manager brief, the brainstorming brief or grill-me summary, `GLOSSARY.md`, `CONSTRAINTS.md` (Full), ADRs in `docs/adr/`, `docs/codemap.md` and the code the change touches. List `specs/` to pick the next number: `NNN` is the highest existing number plus one, three digits; `slug` is two to four kebab-case words.

Look for an existing spec convention: `specs/*/spec.md` (Spec Kit), `.kiro/specs/*/requirements.md` (Kiro), `openspec/changes/*/proposal.md` (OpenSpec), `aidlc-docs/` (AI-DLC). With exactly one found, keep its location and file names and add this template's header table and sections so `spec-lint` applies; never create a parallel `specs/` tree. With two or more, ask which is authoritative. Mapping tables: `references/format-mapping.md`.

### Step 1 — Confirm the path

Copy the score from Discover into the header: `Size | S=5 · files 2 + components 2 + iterations 1` and `Risk | R=1 · money` (or `R=0 · none`). Re-score when the content says otherwise: personal or health data, `irreversible`, or R ≥ 2 force Full; the path is the higher of the size route and the risk route. Never route down; `spec-lint` H05 rejects a path below the score.

### Step 2 — Scope check and capability map

When the request bundles capabilities with their own users or data that ship and verify separately — or the draft passes 5 stories or 15 active ACs — stop and build a **capability map** before any spec:

```markdown
| Module | Responsibility | Consumers | Data owned | Depends on | Spec | Path |
|---|---|---|---|---|---|---|
| identity | Accounts, sessions, SSO | all modules | accounts, sessions | — | 014-identity | Full |
| billing | Plans, invoices, payments | account owner | invoices | identity | pending | Full |
```

Stable kebab-case IDs, one owner per data element, one-way dependencies, one spec per module scored separately and written in build order. Present the map and build order to the Product Owner with one question and end the turn. Slicing rules: `references/capability-map.md`.

### Step 3 — Surface assumptions and ask

Before drafting, list the assumptions and invite correction:

```
ASSUMPTIONS:
1. Web app only, no native mobile
2. Existing session-cookie auth is reused
3. PostgreSQL via the current Prisma schema
→ Correct any of these now.
```

Never fill an ambiguity silently; a behavior the brief does not mention is a question or a non-goal, not permission. Ask one round at a time, at most **4 independent questions per round, each with a recommended answer**. An inferred assumption that changes an AC outcome is a question.

### Step 4 — Draft spec.md from the template

Copy `../agentic-sdlc/templates/spec.md` to `specs/NNN-slug/spec.md` and replace every `{{...}}` placeholder (P01). Delete no section. The header carries ID, Revision (starts at 1), Path, Size, Risk, Owner, Issue and Intake (`n/a — <reason>` or `prior rejection #n — <why this differs>`).

Required sections, in template order:

1. **Problem** — who is affected, what fails today, the evidence (tickets, time lost, error rate)
2. **Users** — each actor with the permission or role that matters
3. **Stories** — "As a …, I want …, so that …"
4. **Experience** — `ux.md` rev N with its state count, or `n/a — <reason>`
5. **Acceptance criteria** — table `ID · Criterion · Priority` (Step 5)
6. **Non-goals** — at least one bullet; carry over the brief's "Not doing" list and name sibling module specs
7. **Constraints** — *Always* / *Ask first* / *Never*, plus numeric limits
8. **Security notes** — data classes, authentication and authorization, inputs, secrets; when `regulated` applies, the obligations table `| Obligation | Clause | Control | AC-n or task | Evidence |` follows (`../agentic-sdlc/references/security.md` § Compliance)
9. **Rollback** — command, verify command with expected output, decision for data written while live
10. **Release & observability** — signal tied to `AC-n`, alert with comparator, number, window and channel, dashboard or query, owner, rollout (flag default off, or ≥ 2 percentage stages), rollback command
11. **Indicator** — numeric baseline with date, numeric target, method, first reading; add a counter-metric when the target could be met by harming something else
12. **Open questions** — `None.` or each item ending `deferred: <owner>`
13. **Revision log** — one row per revision with the critique result; a `### Rev N delta` table from rev 2 on
14. **Approvals** — empty until the Specify sign-off; holds the `### Waivers` table

Never write a status ("Draft", "Approved") into the body: status is derived from `## Approvals`, and writing one would change the hash it records. Keep within the word budget: 1,500 words on Standard, 3,000 on Full (comments, Revision log, Approvals and Open questions excluded).

### Step 5 — Write acceptance criteria and NFRs that can be proven

Each `AC-n` is **observable**, **testable**, **single**, **bounded**, **formatted** (Given/When/Then, or a measurable statement with a number and a unit — AC03), **design-free** and **prioritized** (`critical` when failure loses data, money, access control or a legal obligation; otherwise `normal`). IDs run `AC-1..n` without gaps; a removed criterion keeps its row as `Retired in rev N: <reason>` with priority `—`; IDs are never reused or renumbered.

```
| AC-3 | Given a cursor issued to partner key A, when partner key B sends it, then the API returns HTTP 400 with error code `invalid_cursor` and no orders. | critical |
| AC-5 | Given 250,000 earlier orders, when a page of 200 is requested on staging, then p95 latency over 1,000 requests is ≤ 600 ms. | normal |
```

Run the unhappy-path checklist on every story — permission, invalid input, limit + 1, empty state, concurrency, dependency failure, retry, time zones, data lifecycle — and turn each hit into an AC or a non-goal. EARS sentences are welcome as a drafting form; convert them to Given/When/Then unless they already carry a number and a unit. Twelve good/bad pairs: `references/ac-rubric.md` §1–§3, §5, §6; the EARS conversion table, only when EARS is used: §4.

Turn every quality word into a number. Each NFR is metric + comparator + number + unit + condition + method, placed where it is enforced: a Test-time threshold is an AC, a builder rule is a Constraint, a production threshold is an Alert, a business outcome is the Indicator, an accessibility check is a `ux.md` row. `spec-lint` V01 flags 30 vague terms (*fast*, *scalable*, *robust*, *user-friendly*, *large*, *many*, *gracefully* …) unless a number with a unit sits in the same sentence. Catalog by category (performance, capacity, reliability, security, privacy, accessibility, observability, compliance, compatibility): `references/nfr-catalog.md`.

When `ux.md` exists, every state row maps to an AC, to `pattern: <component>`, or to `proposed` — and every proposed state becomes an AC or a non-goal before Step 6 ends.

### Step 6 — Doubt pass, critique and stop rule

Dispatch a **fresh-context challenger** with `prompts/doubt-pass.md`: a subagent that receives only `spec.md`, the brief it was built from, `ux.md` and `threat-model.md` when present, and the checklist — never the drafting conversation. When the host has no subagents, clear working notes and run the prompt inline as a separate pass labelled `self-review` (`../agentic-sdlc/references/platforms.md` § 3). The challenger reads with three lenses — ambiguity, contradiction and gap, testability — plus a delta lens in revise mode, and answers each checklist item:

| # | Check |
|---|---|
| 1 | Would two engineers build different things that both satisfy every `AC-n`? |
| 2 | Is each criterion observable and decided by a test or command without interpretation? |
| 3 | Does each criterion state one behavior, with its bounds (size, role, timeout, error)? |
| 4 | Are invalid input, missing permission, empty state, limits, concurrency and partial failure covered? |
| 5 | Is any criterion a design decision in disguise? |
| 6 | Do the non-goals block the nearest scope creep? |
| 7 | Are the data classes named, personal data excluded or protected, all four security notes filled, and every high or critical threat mitigated by an active AC? |
| 8 | Is the rollback executable as written, with a verify command and a decision for data written while live? |
| 9 | Does release & observability name a signal per critical `AC-n`, a numeric alert with a window, an owner and a rollout? |
| 10 | Is the indicator measurable with tools that exist today, with a real baseline? |
| 11 | Is every vague word quantified and every number given a unit? |
| 12 | Does the path score match the content, and is every open question answered or deferred with an owner? |

Severity: **Critical** blocks the request (lint error, untestable critical AC, contradiction between ACs, a brief requirement silently dropped); **Important** is fixed in this revision (two readings, missing negative case on a critical AC, unmeasured quality claim); **Minor** is wording. **Material** = Critical or Important — any finding whose answer changes an AC outcome, the scope or the handling of data.

On a material ambiguity, **STOP**: ask the Product Owner (or the owner named in the brief) in one round, with a recommended answer per question. Fix non-material findings directly. Re-run the doubt pass on the changed text.

**Stop rule.** At most **3 question rounds** and 3 doubt cycles per Specify pass. After the third, each open item becomes an Open questions entry `deferred: <owner>` when the build proceeds safely without it, or the stage ends `NEEDS_CONTEXT` (naming the missing input) and no approval request is made. An unanswered material ambiguity is never deferred silently.

Record the result in the current Revision log row, Critique column: `fresh-context · 12/12 · 3 fixed (<short list>), 0 open` or `self-review · 12/12 · 2 fixed, 1 deferred`. `spec-lint` REV03 rejects a current revision without it.

### Step 7 — Lint

```bash
node .agentic-sdlc/bin/spec-lint.mjs specs/NNN-slug/spec.md                # vendored copy (project-context)
node skills/agentic-sdlc/scripts/spec-lint.mjs specs/NNN-slug/spec.md      # this repository
node ../agentic-sdlc/scripts/spec-lint.mjs specs/NNN-slug/spec.md          # from an installed skill folder
```

| Exit | Meaning | Next action |
|---|---|---|
| 0 | All rules pass (warnings listed) | Proceed to the request; carry warnings into Residual risks |
| 1 | Rule failures, each with a rule ID and line | Fix, re-run; never request approval on exit 1 |
| 2 | File missing or not built from the template | Start from `templates/spec.md` |

Rule families: header and routing (H), placeholders (P), sections (S), ACs (AC), non-goals, security notes, rollback, release and observability (OBS), indicator, open questions, revision log (REV), vague terms (V01), word budget, threat model (TM01 Full without `threat-model.md`; TM02 warning on risk-flagged Standard; TM03 high threat without an active AC), waivers (WV) and approvals (AP, with `--check-approval`). Without Node, apply the rules by hand from the template comments and paste the result into the request (`../agentic-sdlc/references/platforms.md` § 4).

### Step 8 — Specify sign-off

Follow `../agentic-sdlc/references/governance.md` § 2 exactly (pre-check, request, register row, end of turn, which replies count, record). Specify specifics:

1. The hash comes from `spec-lint --hash specs/NNN-slug/spec.md`.
2. The one request message also carries the critique summary and the `ux.md` and `threat-model.md` revisions, and asks the named role: `Product Owner: approve spec.md rev 1 (hash 2aef8f23fc84) as the build baseline? Reply "yes" or list changes.`
3. **End the turn.** Do not start Design in the same turn. A yes mixed with changes is a rejection: apply the changes as a new revision and ask again.
4. After recording the `## Approvals` row and the register row, confirm with `spec-lint --check-approval specs/NNN-slug/spec.md` (exit 0).

**Combined review (Standard, plan with ≤ 5 tasks).** Fix the spec hash first, hand off to `writing-plans` for `plan.md`, then send one request covering both artifacts; record `Specify + Design (combined)` in each artifact and one register row per artifact. On Full the four sign-offs are separate (`../agentic-sdlc/references/lifecycle.md` § 3).

Hand off: `senior-solution-architect` when a decision is expensive to reverse, `test-strategy` for acceptance tests, then `writing-plans` (Design).

### Validate mode

Run Steps 5, 6 and 7 against an existing spec and report a findings table — section, rule ID or checklist item, issue, severity, concrete fix (a rewritten AC, a number, a missing negative case). Do not rewrite the spec without the owner's approval of the findings.

### Revise mode — delta spec

Any edit to hashed content after approval — an AC, a non-goal, the rollback, the alert threshold, a comment, a typo — changes the hash and **voids** the approval (`--check-approval` → AP04, so `preflight` stops Build). Run the change protocol (`../agentic-sdlc/references/rules.md` § Change protocol):

1. Stop the current Build task at its next green test run.
2. Add a Revision log row: what changed, why, who asked, date.
3. Write `### Rev N+1 delta` under the Revision log: rows **Added**, **Changed**, **Removed** and at least one **Must not change** (a behavior the change could break, backed by an active or new regression AC), plus an Impact line (AC-n, tasks, tests, ADRs, rollback, alert, indicator, path re-score).
4. Edit the body as revision N+1: bump Revision, retire removed criteria, add new IDs after the last one.
5. Re-run the doubt pass with the delta lens, then `spec-lint`.
6. Request Specify sign-off again; the new row carries rev N+1 and the new hash, earlier rows stay. A void Specify sign-off also voids the Design sign-off built on that hash (`governance.md` § 4).
7. Resume at the earliest affected stage.

A new requirement after release is not a revision: open a new Discover item and a new spec that cites the old ID. Recording an approval or a waiver does not change the hash. Delta format, approval states and anti-patterns: `references/revise-mode.md`.

**Close.** End with the `status.mjs --next` output.

## Anti-rationalization

The left column quotes thoughts to catch, not guidance.

| Thought | Reality |
|---|---|
| "The PO is busy; approval is implied" | No explicit yes in a later turn, no approval. Ask, end the turn, wait. |
| "It's only a typo in an approved spec" | The hash changed; the approval is void. Rev N+1 with a one-row delta. |
| "The happy path is enough for now" | Permission, invalid input, limits and failure are where defects live. Cover them or list them as non-goals. |
| "'Fast' is obvious to everyone" | Two engineers will pick two numbers. Write percentile, load, data set and unit. |
| "The brief didn't forbid it, so it's in" | Silence is not permission. Ask, or write a non-goal. |
| "I'll critique my own draft in the same breath" | Same-context review confirms its own assumptions. Fresh context, or a labelled `self-review` pass after clearing notes. |
| "This epic fits in one spec" | Over 5 stories or 15 ACs means it does not. Map the capabilities first. |
| "The Kiro EARS file is already a spec" | Without the header, AC IDs and Approvals no gate can check it. Map it, then lint. |
| "Renumbering keeps the table tidy" | Tasks, commits and tests cite the IDs. Retire; never renumber. |
| "One more question round will settle it" | The bound is 3. Defer with an owner or report `NEEDS_CONTEXT`. |

## Critical Rules

- **NEVER** start or allow Build before a valid Specify sign-off on Standard and Full; `spec-lint --check-approval` exit 0 is the evidence.
- **NEVER** request approval on `spec-lint` exit 1, or count a reply given in the same turn as the request.
- **NEVER** fill an ambiguity silently; a material ambiguity stops the draft until it is answered or deferred with an owner.
- **NEVER** run more than 3 question rounds or 3 doubt cycles per Specify pass.
- **NEVER** edit an approved spec without a new revision, a delta with a Must-not-change row, and a new approval request.
- **NEVER** write implementation details as acceptance criteria, or a status line into the spec body.
- **NEVER** route down: the header path is at least the scored path.
- **NEVER** create a parallel `specs/` tree next to an existing spec convention.
- **ALWAYS** number criteria `AC-n`, contiguous and stable; retire, never reuse, removed IDs.
- **ALWAYS** express every quality requirement as a number with a unit, in the section where it is enforced.
- **ALWAYS** fill Release & observability with an AC-tagged signal, a numeric alert with a window and an executable rollback command.
- **ALWAYS** keep real personal, health or client data out of specs, examples and fixtures.

## Example Usage

**1. Synthesize from a grill-me summary (Standard)**
> "We agreed the export design in grill-me — write the spec."

Synthesize mode, no re-interview. Lists three assumptions, drafts `specs/001-csv-export/spec.md` with AC-1..AC-4 (filtered rows, formula-injection escaping, 403 without permission, 50,000-row limit), a flag rollback with a verify command and the indicator "export tickets 14/month → ≤ 4/month". The doubt pass fixes three items; `spec-lint` exits 0. The plan has five tasks, so one combined request goes out and the turn ends; the Product Owner's "Yes — approved" arrives next turn and is recorded with the hash. Worked example: `../agentic-sdlc/examples/worked-example/specs/001-csv-export/`.

**2. Bug fix routed up by risk**
> "Users get logged out after 5 minutes; fix the session timeout."

Scores S=3 (Quick on size) but R=1 · auth, so the path is Standard and a short spec is written. AC-1/AC-2 pin 29 and 31 minutes; AC-4 is a regression pin — the 12-hour absolute limit must not change. The Security Auditor's threat model clears TM02. See `examples/031-session-idle-timeout/`.

**3. Requirement change after approval (revise mode)**
> "Partner 977 wants 200-row pages, and drop total_count — it's too slow."

Writes Revision log row 2 and a `### Rev 2 delta`: Changed AC-2 and AC-5, Removed AC-6 (retired, not deleted), Added AC-7 `has_more`, and three Must-not-change rows (offset compatibility AC-4, key-bound cursor AC-3, response envelope). `--check-approval` reports AP04 until the Product Owner approves rev 2 in a later turn; the combined Design sign-off is requested again. See `examples/044-orders-cursor-pagination/`.

**4. Regulated personal-data feature (Full)**
> "Let EU customers download all their data themselves (GDPR Art. 15)."

R=2 · personal data, regulated → Full. The NFR catalog turns "secure and timely" into ACs: password re-entry, owner-only download, 7-day deletion with HTTP 410, 30-day deadline alert, audit events without content, WCAG 2.2 AA. Security notes carry a five-row obligations table; `threat-model.md` maps every high threat to an AC; an open question about inferred segments is deferred to the DPO. See `examples/052-account-data-export/`.

**5. Epic, then validate an imported Kiro spec**
> "Spec the customer portal: login, billing, notifications, usage reports — we already have `.kiro/specs/billing/requirements.md`."

The scope check builds a four-module capability map; the Product Owner confirms the order. Kiro is the one existing convention, so `requirements.md` stays in place: validate mode reports the missing header table (H01–H06), missing sections (S01) and four EARS lines without units (AC03); the import adds the header, AC table and Approvals, and `spec-lint` exits 0 before the billing sign-off request.

## References

| File | Load when |
|---|---|
| `references/ac-rubric.md` §1–§3, §5, §6 | Writing or critiquing ACs (Step 5), or fixing AC01–AC04 and V01 findings; §4 when converting EARS |
| `references/nfr-catalog.md` | A story implies speed, load, uptime, privacy, accessibility, audit or compliance, or checklist item 11 fails |
| `references/capability-map.md` | The scope check finds an epic: ≥ 2 independent subsystems, > 5 stories or > 15 ACs |
| `references/revise-mode.md` | A spec changes after a sign-off request or approval, or a re-score moves the path |
| `references/format-mapping.md` | The repository holds Spec Kit, Kiro, OpenSpec, AI-DLC or BMad specs, or a spec must be exported |
| `prompts/doubt-pass.md` | Step 6 critique, on every draft and every revision |
| `examples/README.md` | Before a first spec in a new domain: three lint-clean specs (Quick-size bug fix, Standard API at rev 2, Full regulated) |
| `../agentic-sdlc/templates/spec.md`, `ux.md`, `threat-model.md` | Step 4 drafting |
| `../agentic-sdlc/references/governance.md`, `rules.md` | Sign-off, hash, change protocol |
| `../agentic-sdlc/scripts/spec-lint.mjs` | Step 7, and the rule text behind any lint code |
