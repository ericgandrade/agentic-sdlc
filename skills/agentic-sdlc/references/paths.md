# Agentic SDLC — Paths: Select, Score, Escalate, Adopt

Load this file in Discover for every work item and in Build whenever a task touches more files than the path allows or meets a new risk trigger. It decides how much process a change gets (Quick, Standard or Full), how deep the approvals go, when work moves up a path and how the method enters an existing codebase. `references/rules.md` rule 11 ("Right-size, never down") is the governing rule; this file is its procedure.

## 1. Selection rule (mechanism 14.1)

| Step | Action | Record |
|---|---|---|
| 1 | The Analyst collects the three size inputs and checks the seven risk triggers (§2) from the request, the code map (`docs/codemap.md`) and the code | — |
| 2 | Compute S and R, look up the size route and the risk route | — |
| 3 | **Path = the higher of the two routes.** Risk overrides size: a one-file change with a Full-forcing trigger is Full | — |
| 4 | Write the score line before any other artifact | Quick: first line of the issue body. Standard/Full: header of `specs/NNN-slug/spec.md` |
| 5 | Show the score line to the requester in one sentence and continue; the path needs no separate approval | — |

Score line format: `Path: Standard · S=5 · R=1 (money)`. A score with any missing input is written `Path: Standard · default: inputs missing (<input>)`.

Failure behaviour:

- **Any input unknown** (files cannot be estimated, risk trigger unclear) → path Standard, recorded as above; re-score when the input becomes known during Specify or Design and route up when the new score is higher.
- **A human disputes the score** → the higher route wins. A lower route than the score needs a waiver (`references/governance.md` §Waivers: owner ≠ requester, reason, expiry ≤ 30 days, follow-up issue) recorded under the score line.
- **Re-score lower than the current path** → the path stays; routing down happens only through the same waiver. Never route down silently.

## 2. Score (rubric)

### Size S (3–9)

| Input | Definition | 1 point | 2 points | 3 points |
|---|---|---|---|---|
| Files | Source, test, config and migration files created, modified or deleted; lockfiles and generated files excluded | ≤ 3 | 4–15 | > 15 |
| Components | Separately built or deployed units touched: API service, web client, worker, database schema, shared package | 1 | 2 | ≥ 3 |
| Iterations | Merged PRs needed before the change is complete in production | 1 | 2 | ≥ 3 |

Size route: **S ≤ 4 → Quick · S 5–6 → Standard · S ≥ 7 → Full.**

### Risk R (0–7)

R is the count of triggers present. Check each one against the diff the change will produce, not against the request wording.

| Trigger | Present when the change… | Route effect |
|---|---|---|
| auth | reads or changes authentication, authorization, sessions, tokens, roles or permission checks | +1 |
| personal/health data | stores, exports, logs or displays a field that identifies a person (name, email, phone, address, government ID, IP address tied to a user) or any health data | **Full-forcing** |
| money | computes, stores, displays or moves prices, totals, balances, payments, refunds or invoices | +1 |
| public API | changes a request, response, event or CLI contract consumed outside the repository | +1 |
| schema/migration | changes a database schema, adds a migration or changes a stored file format | +1 |
| irreversible | deletes or overwrites data with no restore path, sends external messages, or performs a one-way migration | **Full-forcing** |
| regulated | falls under a stated regulation or contract clause (HIPAA, PCI DSS, GDPR, SOX, IEC 62304, a client audit clause) | +1 |

Risk route: **R = 0 → Quick · R = 1 → Standard · R ≥ 2, or any Full-forcing trigger → Full.**

### Scored examples

| Request | Files · Comp. · Iter. | S | Triggers | R | Size / risk route | Path |
|---|---|---|---|---|---|---|
| Fix a typo in the settings page label | 1 · 1 · 1 | 3 | — | 0 | Quick / Quick | **Quick** |
| Date column shows UTC instead of the user's time zone | 2 · 1 · 1 | 3 | — | 0 | Quick / Quick | **Quick** |
| CSV export of order IDs, dates and totals (`examples/worked-example/`) | 5 · 2 · 1 | 5 | money | 1 | Standard / Standard | **Standard** |
| Sessions expire after 5 minutes instead of 30 | 2 · 1 · 1 | 3 | auth | 1 | Quick / Standard | **Standard** |
| Add customer email to the CSV export | 5 · 2 · 1 | 5 | money, personal data | 2 | Standard / Full | **Full** |
| Drop the legacy `orders_old` table | 3 · 1 · 1 | 3 | schema, irreversible | 2 | Quick / Full | **Full** |

The fourth and sixth rows show risk overriding size. The tool form of this rubric (`scripts/path-score.mjs`†) returns the same route for the same inputs.

## 3. Approval depth by path (mechanism 10.2)

| | Quick | Standard | Full |
|---|---|---|---|
| Specify sign-off | — (acceptance test in the issue) | Product Owner | Product Owner, separate review |
| Design sign-off | — | Tech Lead; **one combined Specify + Design review when the plan has ≤ 5 tasks**, otherwise two | Tech Lead, separate review |
| Test sign-off | 1 human reviewer | 1 human reviewer | **2 human reviewers**, at least one not involved in Design |
| Release sign-off | Release Owner, only when production deploys | Release Owner | Release Owner, after the rollback rehearsal output is attached |
| Review lenses | L1 + L2; L3 added on a Quick item kept by waiver despite a risk trigger | L1–L4 | L1–L4 |
| Artifacts | Issue with acceptance test, PR with Verification | `spec.md`, `plan.md`, `graph.json`, `acceptance-tests.md`, PR, release notes | Standard set + ADRs, `threat-model.md`, `CONSTRAINTS.md`, runbook |
| Retro | Batched: every 10 merged items or 14 days, whichever comes first | Within 5 business days of Release, ≤ 15 min | Full retro within 5 business days |

Failure behaviour: an approval missing for the current path → status `BLOCKED` at the next stage entry (`references/lifecycle.md` §1); `approval-check`† (mechanism 10.4) fails the PR check once CI is installed.

## 4. Escalate (mechanism 14.3)

### Triggers

Checked by the Developer at each Build task start and before each commit, and by the Reviewer when the PR opens:

| Trigger | Detection | Bound |
|---|---|---|
| File bound exceeded | `git diff --name-only <base>...HEAD` plus uncommitted files, counted with the §2 file definition | Quick > 3 files · Standard > 15 files · Full: no bound |
| New risk trigger | A §2 trigger present in the diff that the score line does not list | Any one |
| Component or iteration growth | The change now needs another deployed unit or another PR that raises S into a higher size route | Size route rises |

### Procedure

1. Stop at the next green test run. Do not write more production code.
2. Record a `halt` row with reason `path-escalation` in the loop ledger (attended) or the run ledger (unattended; result `NEEDS_HUMAN`, `references/autonomous.md` halt list).
3. Re-score with §2 using the actual diff and write the new score line.
4. Log the change: `Rev N+1 · route Quick → Standard · trigger: files 5 > 3 · S 3 → 5 · R 0 → 0` in the spec Revision log; on a Quick item that has no spec, create `specs/NNN-slug/spec.md` from the issue's acceptance test and put the entry there.
5. Produce the artifacts the new path requires and request its approvals (§3). Commits already made stay on the branch and are re-verified under the new path.
6. Resume Build only after the new approvals are recorded with valid hashes.

Output: the Revision log entry, the new score line and the ledger `halt` row.

Failure behaviour: Build continuing past a trigger without re-routing → the Reviewer files an Important finding `path not escalated` and the verdict is NO-GO; in unattended mode the run halts (`NEEDS_HUMAN`). A change that shrinks during Build stays on its path (§1).

## 5. Brownfield entry — adopt mode (mechanism 14.1)

**Trigger.** First use of the method on an existing repository: ≥ 1 commit, ≥ 1 source directory, and no `<!-- AGENTIC-SDLC:BEGIN -->` block (router Step 0 state 1).

**Procedure.** Run `project-context` in adopt mode before the first change. It explores and documents the system:

1. Read the existing instruction files, manifests, CI configuration and the last 30 commits.
2. Run the existing test suite once and record the baseline: date, commit SHA, passing / total tests, coverage percentage.
3. Write `docs/codemap.md` from `templates/codemap.md`: every top-level source directory mapped to a module with its paths, dependencies and tests.
4. Write the AGENTS.md block with the `sdlc-dod` Definition of Done; `coverage_min` = the measured baseline coverage.
5. Vendor the method's scripts into `.agentic-sdlc/bin/` with `VERSION` and `SHA256SUMS`.

**Output.** The AGENTS.md block (with the `Baseline:` line), `docs/codemap.md`, `.agentic-sdlc/bin/`.

**Rules for the first changes in a brownfield repository:**

- A task that changes a function with no covering test first adds a characterization test that pins the current behaviour, tagged `CHAR-n`, and commits it green before the change (`references/brownfield.md`†).
- A module the plan touches that is missing from the code map → update `docs/codemap.md` first, in the same PR.
- Size inputs come from the code map: components = mapped modules that are built or deployed separately.

**Failure behaviour.**

- Any code change requested before adopt mode completes → status `BLOCKED` with next step `project-context` (adopt).
- Baseline tests red at adoption → each failing test is listed in the block's `Baseline:` line and one issue labelled `baseline-red` is opened per test; Build preflight halts on a red baseline until the test is fixed or a waiver covers it.
- No test suite at all → `Baseline: no tests`; every first change on that code is at least Standard, and characterization tests come first.

† Added in a later release; manual fallback in `references/artifacts.md` §Later-release files.

## Sources

Risk-scaled routing and the escalation rule adapt BMad Method (MIT) quick/full flows and Matt Pocock's skills (MIT) brownfield exploration habits; the separation of size from risk follows the concept of risk-driven depth also found in Agile V, expressed here in original wording. All text is original.
