---
name: codebase-modernization
description: This skill should be used when the user needs to change or modernize existing code safely — inventorying a legacy codebase and its dependencies, scoring components by value and risk, deciding to retire, retain, rehost, upgrade, re-platform, refactor or migrate, researching how the code works today with cited evidence, pinning current behaviour with characterization tests (CHAR-n) before touching untested code, designing expand-contract schema changes or a strangler cutover, slicing the migration into ordered slices for writing-plans, or writing a migration runbook (the Specify and Design stages of the Agentic SDLC on brownfield code). Not for first entry into a repository or its code map (use project-context), designing a new system (use senior-solution-architect), or web research (use deep-research from knowledge-superskills, when installed).
license: MIT
---

# Codebase Modernization

## Purpose

**Agentic SDLC · Specify and Design stages (feeds Build)** on brownfield code. Used by the **Analyst** (inventory, classification, current-state research), the **Architect** (dispositions, target design, expand–contract and strangler), the **Planner** (migration slices), the **Test Engineer** (characterization tests `CHAR-n` at the base commit) and the **Developer** (pinning before each change in Build).

Legacy code carries behaviour nobody wrote down. This skill makes the current state explicit before the change: what exists and who depends on it, which parts deserve investment, how the code behaves today (cited at one commit, pinned by tests, bugs included) and how to move from old to new in steps that each deploy and roll back alone.

The stage contract is `../agentic-sdlc/references/brownfield.md` (CHAR rule and ID format, research and citation rule, expand–contract and strangler rule). Repository entry — the AGENTS.md block, `docs/codemap.md`, the test baseline — is adopt mode in `project-context` (`../agentic-sdlc/references/paths.md` §5) and must be complete before this skill starts. Every rule in `../agentic-sdlc/references/rules.md` applies; this file adds the procedure, rubrics and formats.

Artifacts this skill writes:

| Artifact | Location | Written by | Step |
|---|---|---|---|
| Inventory, dependency map, scores, dispositions | `docs/modernization/inventory.md` | Analyst (dispositions proposed with the Architect) | 1–3 |
| Current-state research + CHAR register | `specs/NNN-slug/current-state.md` from `templates/current-state.md` | Analyst (research), Test Engineer (register) | 4, 6 |
| Characterization tests | test files listed in the plan task's `Files` | Test Engineer or Developer | 6 |
| ADR per non-retain disposition and per transition pattern | `docs/adr/NNNN-slug.md` | Architect | 3, 7 |
| Migration tasks | `specs/NNN-slug/plan.md` `## Tasks` | Planner | 8 |
| Migration runbook | `specs/NNN-slug/migration-runbook.md` from `templates/migration-runbook.md` | Release Engineer (drafted in Design) | 9 |

## When to Use

- A legacy system, service or module needs a modernization roadmap: what to retire, keep, upgrade, re-platform, refactor or replace, and in what order.
- A change must touch code that no test executes (pin it first).
- Facts about how the existing code works are needed for a spec or a design, with citations instead of recollection.
- A schema, stored format or public API changes while old consumers still run (expand–contract).
- A component is replaced while traffic flows (strangler, dual-run comparison, cutover, rollback).
- A component looks unused and someone wants it deleted.

Not for:
- First entry into a repository (AGENTS.md block, code map, baseline) → `project-context` adopt mode.
- Implementing one plan task test-first → `test-driven-development` (its brownfield variant references this skill for `CHAR-n`).
- A failure whose cause is unknown → `systematic-debugging`.
- Writing the spec itself → `spec-driven-development`; comparing technologies for a new system → `senior-solution-architect`.
- Rollout mechanics of an ordinary release → `deployment-pipeline`; acceptance tests from approved ACs → `test-strategy`.
- Web or market research → `deep-research` (knowledge-superskills, when installed).

## Workflow

### Step 0 — Preconditions and scope

1. Check the AGENTS.md block (`<!-- AGENTIC-SDLC:BEGIN -->`) and `docs/codemap.md`. Either missing → status `BLOCKED`, next step `project-context` adopt. Code map `verified` older than 90 days, or a touched top-level directory unmapped → refresh the map first (`project-context` codemap mode).
2. Read the `Baseline:` line. A red baseline blocks Build on the affected modules until each failing test is fixed or waived; never delete or skip a failing test.
3. Pick the scope from the request:

| Scope | Use when | Steps |
|---|---|---|
| **portfolio** | A roadmap or "what should we modernize" across ≥ 2 components | 1–3, then one work item per roadmap entry |
| **change** | One change to existing, partly untested code | 4, 6, (7 when a schema, format, API or component swap is involved), 8 |
| **cutover** | Replacing a live component or moving data | 4, 6, 7, 8, 9 |
| **retire** | Deleting a component, endpoint, job or table | 3 (retire criteria), 4, 9 |

4. Score the path with `../agentic-sdlc/references/paths.md` §2 for each work item (not for the portfolio). Typical triggers here: schema/migration, public API, irreversible (data removal, contract step). `../agentic-sdlc/references/lifecycle.md` §3 lists brownfield modernization under Full; the score decides, and the path never routes down.

### Step 1 — Inventory and dependency map (portfolio scope)

Build `docs/modernization/inventory.md` from the code map, not from a fresh scan. Procedure, commands and the file format: `references/inventory-and-dependency-map.md`.

1. **Components.** One row per code-map module (≤ 30; above that, group by `deploy` unit). Add runtime and framework with exact versions from manifests and lockfiles, datastore, owner, test command and coverage of the module.
2. **Dependency map.** Four edge kinds: code (`depends_on` from the map), runtime calls (HTTP, RPC, queues, cron), data (tables or files read or written by ≥ 2 modules — the riskiest edges), external (`ext:` packages and third-party services with version and support end date).
3. **Hot spots.** Commits per module in the last 12 months (`git log --since=12.months --name-only --format=`), excluding dependency bumps; top 10 files by churn.
4. **Evidence columns.** Support end dates and advisories come from the vendor's lifecycle page and the project's audit command output, recorded with the access date. "Probably end-of-life" is not evidence; leave the cell `unknown` and score it as the worst value.

Output: the inventory table, the dependency map, cycles listed, shared-data edges flagged. No owner → `none`; an unreadable version → `unknown`, never guessed.

### Step 2 — Classify value and risk

Score every component with `references/disposition-rubric.md` §1. Summary:

- **Value V (0–9)** = criticality (0–3) + change demand (feature commits in 12 months: 0 / 1–10 / 11–50 / > 50 → 0–3) + reach (active consumers in 30 days: 0 / 1 / 2–5 / > 5 → 0–3).
- **Risk K (0–12)** = support status (supported > 12 months / ends in 6–12 / ends < 6 / end-of-life → 0–3) + advisories (none / low-medium / high / critical → 0–3) + test safety (coverage ≥ 70% / 40–69 / 1–39 / 0 → 0–3) + knowledge (≥ 2 active people and an owner / 1 / owner but none active / no owner → 0–3).
- **Flags** (not scored; they feed the path score): personal/health data, money, public API, irreversible data.

Quadrant: **Act now** V ≥ 5 and K ≥ 6 · **Keep healthy** V ≥ 5 and K ≤ 5 · **Contain or retire** V ≤ 4 and K ≥ 6 · **Leave** V ≤ 4 and K ≤ 5. Order inside a quadrant by V × K. Every score cell cites its evidence (lockfile line, advisory ID, coverage output, commit count).

### Step 3 — Choose a disposition per component

Apply `references/disposition-rubric.md` §2–§3. One disposition per component per roadmap entry:

| Disposition | Meaning | Typical quadrant |
|---|---|---|
| retire | Remove the component and its data path | Contain or retire; V = 0 |
| retain | Keep as is; set a review date ≤ 12 months | Keep healthy, Leave |
| rehost | Same code, new infrastructure | Hosting end-of-life, code supported |
| upgrade | Same platform, supported versions | Any quadrant with support or advisory risk |
| re-platform | New runtime, framework or datastore, minimal code change | Act now, upgrade path closed |
| refactor | Same behaviour, new structure, to cut change cost | Act now with high demand |
| migrate | Replace the capability with another system, via strangler | Act now, platform dead end |

Record per component: V, K, quadrant, disposition, evidence, the strongest rejected alternative with the reason, reversibility (one-way or two-way door), estimated iterations (merged PRs), first slice.

Approval routing — agents propose, humans decide:
- Every disposition other than retain → an ADR with status `Proposed` (Architect), accepted only at the Design sign-off of the first work item that implements it.
- Retiring a capability users or partners can see → a Product Owner decision recorded as a non-goal or AC in that work item's spec (Specify sign-off).
- **Retire** additionally needs zero-use evidence (logs or metrics, default window 30 days, stated in the spec) and a named replacement or an explicit "capability dropped" decision.

Output: the roadmap — ordered work items, each with its disposition, first slice and path triggers. Each item enters Discover as its own scored work item.

### Step 4 — Research the current state behind a question firewall

For the modules a work item touches, write `specs/NNN-slug/current-state.md` from `templates/current-state.md`. Rules and catalogue: `references/research-firewall.md`; researcher prompt: `prompts/current-state-researcher.md`.

1. **Fix the commit.** Record the 12-hex SHA of the base commit. All reads use it: `git show <sha>:<path>`, `git grep -n <pattern> <sha> -- <paths>`, `git log <sha>`.
2. **Write 3–7 factual questions** in four shapes: *how does X work*, *where does X live*, *what touches X*, *why is X this way* — plus *how is X tested* for every touched module. A question never names the intended change: "where would a cancellation hook go?" is rewritten as "where does an order reach a final state, and what runs then?".
3. **Firewall the researcher.** Dispatch a fresh subagent per question group with only the questions, the SHA, the paths in scope and the exclusion list (`specs/`, `docs/plans/`, issues, PR text, design notes — anything stating intent). Budget: ≤ 15 files read per question. **No subagents on the platform** → write the questions to the file first, clear working notes and the change request from context, then answer from the questions file alone in a separate labelled pass.
4. **Cite every claim.** Code claims: `path:line @ <sha>` (a range `path:12-30 @ <sha>` for a block). History claims: `<sha> "<commit subject>"`. Commit messages are claims by their author, weaker than code. No recommendations in this file; design questions go to the Architect in a separate list.
5. **Verify.** A second fresh subagent (`prompts/citation-verifier.md`; no subagents → run it in a fresh labelled pass after clearing working notes) re-opens every load-bearing citation and ≥ 20% of the others. Verdict per claim: verified · disputed (both readings reported, never averaged) · overturned (removed) · unverified (kept with the label, never used as the basis for an AC).
6. **Freshness.** Before any sign-off request that relies on the file, run `git diff --name-only <sha>..HEAD -- <cited paths>`; each changed path → re-verify its claims and bump the SHA.

### Step 5 — Hand the change to Specify

The Analyst writes the spec with `spec-driven-development`; this skill supplies brownfield content:

- `## Constraints`: "Behaviour pinned by `CHAR-a..b` is preserved except where an AC states otherwise", the consumers from the dependency map that must keep working, and the schema compatibility rule (old and new code valid at every step).
- An AC for every intended behaviour change to legacy code, written against the pinned behaviour: "Given an invoice of 10.005, When the total is calculated, Then it is 10.01 (today 10.00, pinned by CHAR-3)".
- `## Rollback`: the per-phase rollback from Step 7, and for an irreversible step the backup and restore commands.
- `## Release & observability`: the dual-run mismatch threshold, the zero-use window for retirement and the bake period before the contract step — each a number with a unit.
- A known bug discovered by research and not fixed by this work item → issue + non-goal line; its CHAR test keeps pinning it.

### Step 6 — Pin current behaviour with characterization tests

Contract: `../agentic-sdlc/references/brownfield.md` §1. Techniques (golden master, approval files, seams): `references/characterization-tests.md`.

1. **Select the targets.** Every function, endpoint, job or query the plan's `## Impact` will modify that no existing test executes. Check with coverage on the touched files at the base commit; the target is 100% of the lines the plan modifies executed by ≥ 1 existing or `CHAR-n` test. A line with no reachable seam → missing-seam finding.
2. **Choose the seam.** Highest public entry point that exercises the behaviour (endpoint, command, exported function). No seam → add the smallest behaviour-neutral seam (parameter, constructor injection, extracted pure function) in its own commit, or report `NEEDS_CONTEXT` to the Planner.
3. **Write the tests.** One behaviour per test; ID first: `CHAR-3 legacy rounding keeps half-even`. `CHAR-n` is unique in the repository: highest existing number + 1 (`git grep -ho "CHAR-[0-9]*" | sort -t- -k2 -n | tail -1`). Expected values are what the code returns today. Known bugs are pinned and named `(pins bug #212)`. Inputs are synthetic; nondeterministic fields (timestamps, generated IDs, ordering) are scrubbed by named scrubbers.
4. **Prove each test can fail.** CHAR tests pass on their first run by design. Mutate the pinned line once (flip the rounding mode, change a boundary), run the test, paste the red output, revert. A test that stays green under every mutation of the pinned code pins nothing → rewrite it.
5. **Register.** One row per test in the CHAR register of `current-state.md`: ID · behaviour · citation · `pins bug: #n` or `—` · protects AC-n · status (`active`, `superseded by AC-n`, `retired with AC-n`). Quick path: the register lives in the PR body.
6. **Commit first.** CHAR tests are the first commit of the task that changes the code: pin → `AC-n` red → green (`test-driven-development` brownfield variant). A standalone pinning task (at most 1 per plan) closes with `node ../agentic-sdlc/scripts/run-ledger.mjs task --run <id> --task Tn --state done --no-red "characterization: CHAR-a..b"`.

**Change rule.** A CHAR test changes only in the commit that carries the AC changing that behaviour (`Refs: Tn AC-n`), with the reason in the commit body and the register row set to `superseded by AC-n`. On Quick, the issue's acceptance test plays the AC role. A CHAR test edited, skipped or deleted any other way is a weakened check: Critical finding.

### Step 7 — Design the transition (Architect)

Patterns, sequences and gates: `references/expand-contract-and-strangler.md`.

| Situation | Pattern |
|---|---|
| Column, table or stored format changes | Expand–contract: expand → dual-write → backfill → switch reads → contract |
| Component replaced while traffic flows | Strangler: facade → route by flag → dual-run → staged shift → retire old |
| Internal implementation swapped behind a stable interface | Branch by abstraction: interface → old impl → new impl behind flag → remove old |
| Consumers on an old interface | Adapter: old interface delegating to the new implementation, plus a deprecation notice |

Rules:
- Every step deploys alone and rolls back alone; old and new code are valid against the schema at every step. A step that changes and removes in one deploy → no Design sign-off request.
- The contract step (drop column, delete table, remove endpoint, delete old code path with data) is irreversible: its own PR and its own Release sign-off, after the bake period stated in the spec, with a backup command and a restore command verified in staging.
- Dual-run comparison logs only counts and hashes of mismatches, never payloads; traffic shifts only at a mismatch rate ≤ the spec threshold.
- Exposure follows `../agentic-sdlc/references/release-ops.md` (1% → 10% → 100% with 30 min / 60 min / 24 h minimum watch windows); rollback routes traffic back to the old path with one command.
- One ADR names the pattern, the phases, the bake period and the irreversible point.

### Step 8 — Slice the migration into plan tasks (Planner)

Write the tasks into `plan.md` with `writing-plans`; validate with `node ../agentic-sdlc/scripts/plan-graph.mjs specs/NNN-slug/plan.md --write`.

1. One task per phase, each ≤ 1 day and a vertical slice that deploys on its own; order: pin (CHAR) → seam → expand → dual-write → backfill → switch reads → (bake) → contract.
2. Each task lists the AC it serves or enables; the pinning commit is the first step of the task that changes the code.
3. `## Impact` comes from the code map plus the dependency map's runtime and data edges; consumers on data edges are dependents.
4. More than 15 tasks, or phases that need separate releases → split into specs per release (the contract step is usually its own spec or iteration).
5. Backfill tasks state batch size (default ≤ 1,000 rows), throttle, idempotency (re-running a batch changes nothing) and a progress query.

### Step 9 — Write the migration runbook (cutover and retire scopes)

Fill `specs/NNN-slug/migration-runbook.md` from `templates/migration-runbook.md` during Design; the Release Engineer completes and rehearses it before the Release sign-off request. It holds: entry criteria, the phase table (command · verify · expected · go condition · rollback), the irreversible point, backup and restore evidence, dual-run readings, the consumer deprecation notice, abort criteria and post-cutover zero-use evidence. The service runbook `docs/runbooks/<service>.md` (`../agentic-sdlc/templates/runbook.md`) receives the new alerts, flags and a change-log row in the same release.

### Step 10 — Report

| Status | When |
|---|---|
| `DONE` | Artifacts for the scope written; every claim verified or labelled; CHAR targets covered |
| `DONE_WITH_CONCERNS` | Unverified claims, unknown support dates or missing-seam findings listed with owners |
| `BLOCKED` | Adopt mode missing, red baseline on a touched module, or a disposition awaiting a human decision |
| `NEEDS_CONTEXT` | No seam reachable, or a question only a person can answer (owner, consumer list) |
| `CANNOT_VERIFY` | Zero-use or support evidence only available in production; name who checks and when |

**Close.** End with the `status.mjs --next` output.

## Anti-rationalization

| Thought | Reality |
|---|---|
| "The legacy result is obviously wrong; pin the correct value" | A CHAR test pins what the code does today, bugs included. Correct behaviour arrives through an AC. |
| "The CHAR test passed first time, done" | Expected for CHAR. Mutate the pinned line once and paste the red output. |
| "This CHAR test is in the way; update it to match" | Only in the commit carrying the AC that changes the behaviour. Otherwise it is a weakened check: Critical. |
| "Tell the researcher the plan so it focuses" | Intent bends findings toward the plan. Questions only; the change stays outside the firewall. |
| "I know this code, no need to cite" | Uncited claims are removed or labelled `unverified`; no AC rests on them. |
| "Rename and convert in one migration, it's quicker" | Old code still reads the old column during rollout. Expand–contract, one reversible step per deploy. |
| "Drop the old column in the same release" | The contract step is irreversible: own PR, own Release sign-off, after the bake period, restore verified. |
| "Nobody uses it; delete it" | Zero-use evidence over the spec's window, plus a Product Owner decision when users can see it. |
| "A rewrite from scratch is cleaner" | A big-bang rewrite has no rollback. Migrate through a strangler with dual-run comparison. |
| "A few production records make the golden master realistic" | Synthetic inputs only; production data never enters fixtures, logs or prompts. |
| "Inventory the whole system before any change" | Portfolio scope only when a roadmap is requested; a single change gets scoped research. |
| "Coverage is low everywhere, test it all first" | Pin what the plan modifies: 100% of touched lines, not the whole codebase. |

## Critical Rules

- **NEVER** change code that no test executes before `CHAR-n` tests pin it, or before a missing-seam finding is recorded and ruled on.
- **NEVER** edit, skip or delete a CHAR test except in the commit carrying the AC (or spec revision) that changes the pinned behaviour.
- **NEVER** give a researcher the intended change, or let intent sources (`specs/`, plans, tickets, PR text) into its reading.
- **NEVER** state a fact about existing code without `path:line @ <sha>`; never base an AC on an `unverified` or `disputed` claim.
- **NEVER** change a schema, stored format or public contract in place, or combine expand and contract in one deploy.
- **NEVER** retire a component without zero-use evidence for the stated window; never decide a disposition for the humans — dispositions are ADR proposals.
- **NEVER** put production records, personal data or secrets in fixtures, golden masters, dual-run logs or research notes.
- **ALWAYS** read code at one recorded commit and re-verify cited paths that changed before a sign-off request.
- **ALWAYS** score the path per work item and route up for schema/migration, public API and irreversible triggers.
- **ALWAYS** give every phase a one-command rollback, and the irreversible step a verified backup and restore.

## Example Usage

**1. Portfolio roadmap.** "Billing (PHP 7.2, no tests), reports (Python 3.6, 12% coverage), auth (Java 11, 70%), an unowned fax-export job." Inventory from the code map; billing V = 8, K = 9 → Act now, re-platform (ADR Proposed); reports V = 5, K = 9 → Act now, upgrade; auth V = 7, K = 1 → Keep healthy, retain, review in 12 months; fax job V = 0, K = 9 → Contain or retire, retire after 30 days of zero calls and a Product Owner decision. Roadmap: billing research + CHAR first, each item its own spec.

**2. Change to untested code.** Spec 041: AC-2 rounds half-up. Research questions ("how is an invoice total rounded today?") answered with `billing/legacy/Invoice.php:212 @ 4f1c2a9b0d3e`. CHAR-1..4 pin `calculateTotal()` through its public entry point, CHAR-3 pins half-even rounding; each shown red under one mutation. T1's first commit pins; AC-2 red; green; the AC-2 commit updates CHAR-3 and marks it `superseded by AC-2`.

**3. Pressure: rename in place and delete failing CHAR tests.** "Rename `customers.phone` to `phone_e164`, convert in place, ship tonight, delete the two failing CHAR tests." Refuse both: failing CHAR tests mean the change alters pinned behaviour → an AC is needed. Re-score: schema/migration + personal data → Full. Expand–contract in four releases; contract (drop `phone`) is its own PR and Release sign-off after the bake period.

**4. Strangler cutover.** Replace `/api/v1/quotes` with the new pricing service. CHAR tests from synthetic requests; facade with flag `quotes.newEngine` (default off); dual-run until mismatch ≤ 0.1% over ≥ 10,000 comparisons (spec threshold); exposure 1% → 10% → 100%; old engine removed after 30 days of zero calls. `migration-runbook.md` rehearsed in staging.

**5. Firewalled research.** "Research cancellation — we plan to move it into an OrderLifecycle service." The brief keeps only factual questions (where does an order end, what touches status, how is it tested), SHA `9b7e…`, exclusions `specs/`, `docs/plans/`. The verifier overturns one claim whose line moved; the design question goes to the Architect.

## References

| File | Load when |
|---|---|
| `../agentic-sdlc/references/brownfield.md` | Always — the stage contract this skill implements |
| `references/inventory-and-dependency-map.md` | Step 1: inventory format, commands, dependency edge kinds, hot spots |
| `references/disposition-rubric.md` | Steps 2–3: V and K scoring tables, quadrant rules, disposition criteria, worked scoring |
| `references/research-firewall.md` | Step 4: question shapes, rewrite catalogue, exclusion list, citation and verdict formats |
| `prompts/current-state-researcher.md` | Step 4: dispatching the firewalled researcher (inline fallback included) |
| `prompts/citation-verifier.md` | Step 4 item 5: verifying citations in a fresh pass |
| `templates/current-state.md` | Step 4: creating `specs/NNN-slug/current-state.md` and its CHAR register |
| `references/characterization-tests.md` | Step 6: seams, golden master, approval files, scrubbers, mutation proof |
| `references/expand-contract-and-strangler.md` | Steps 7–8: phase sequences, dual-run, bake, cutover and rollback gates |
| `templates/migration-runbook.md` | Step 9: cutover and retire runbook |
| `../agentic-sdlc/references/paths.md` | Step 0: path score and brownfield entry |
| `../agentic-sdlc/references/tdd.md` | Step 6: brownfield variant and anti-pattern catalogue |
| `../agentic-sdlc/references/release-ops.md` | Steps 7, 9: rollout stages, runbook rule |
