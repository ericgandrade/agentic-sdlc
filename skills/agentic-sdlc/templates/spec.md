# Spec: {{title}}

<!--
Template for specs/NNN-slug/spec.md (mechanism 2.1). Copy it, replace every {{...}} placeholder,
and delete no section. HTML comments are guidance: spec-lint ignores them, so they can stay.
Check before the Specify sign-off request:
  node .agentic-sdlc/bin/spec-lint.mjs specs/NNN-slug/spec.md      (vendored copy)
  node <agentic-sdlc skill>/scripts/spec-lint.mjs specs/NNN-slug/spec.md
Exit 0 is required to request approval. Exit 1 lists the failing rules; exit 2 means the file is
missing or does not start from this template (no header table).
Status is never written in this file: it is derived from ## Approvals (a valid row with a matching
hash = approved). Writing "Approved" into the body would change the hash it is meant to record.
-->

| Field | Value |
|---|---|
| ID | {{NNN-slug}} |
| Revision | 1 |
| Path | {{Quick \| Standard \| Full}} |
| Size | {{S=n · files n + components n + iterations n}} |
| Risk | {{R=n · trigger, trigger}} or {{R=0 · none}} |
| Owner | {{Product Owner role and person}} |
| Issue | {{tracker link}} |
| Intake | {{n/a — no duplicate or prior rejection found (search: terms used)}} or {{prior rejection #n — why this request differs}} |

<!--
Size and Risk follow references/paths.md §Score.
Size: files (≤ 3 → 1, 4–15 → 2, > 15 → 3) + components (1/2/≥ 3 → 1/2/3) + iterations (1/2/≥ 3 → 1/2/3).
Risk triggers: auth, personal data, health data, money, public API, schema/migration, irreversible, regulated.
spec-lint recomputes the route: Path lower than max(size route, risk route) → exit 1 (never route down).
Intake records the Discover-stage duplicate search (references/lifecycle.md §Intake decision). A duplicate
stops the work item, so a spec only carries "n/a — <reason>" or "prior rejection #n — <why it differs>".
-->

## Problem

{{Who is affected, what fails or is missing today, and the evidence (ticket count, metric, quote).}}

## Users

{{Each user or actor, with the permission or role that matters to this change.}}

## Stories

- As a {{user}}, I want {{capability}}, so that {{outcome}}.

## Acceptance criteria

<!--
IDs AC-1..AC-n: unique, contiguous, never reused. A removed criterion keeps its row with the text
"Retired in rev N: <reason>" and priority "—". Each criterion is either Given/When/Then or a
measurable statement with a number and a unit (for example "p95 ≤ 800 ms for 50,000 rows").
One behaviour per row. Cover unhappy paths: invalid input, missing permission, empty state, limits.
Priority: critical (Release go/no-go needs fresh evidence for it) or normal.
-->

| ID | Criterion | Priority |
|---|---|---|
| AC-1 | Given {{context}}, when {{action}}, then {{observable outcome}}. | {{critical \| normal}} |

## Non-goals

<!-- ≥ 1 bullet. Each names something a reader would reasonably expect and that this spec excludes. -->

- {{explicitly out of scope}}

## Constraints

<!-- Boundaries for the agents: Always / Ask first / Never, plus feature limits and CONSTRAINTS.md references (Full). -->

- **Always:** {{rule}}
- **Ask first:** {{rule}}
- **Never:** {{rule}}

## Security notes

<!--
Mechanism 11.1. Every row is filled; write "none — <reason>" when a topic does not apply.
Risk-flagged specs (Full; or a trigger among auth, personal/health data, money, public API) also get
specs/NNN-slug/threat-model.md; a threat rated high needs a mitigation that cites an AC-n.
-->

| Topic | Notes |
|---|---|
| Data classes | {{data read, written or exported, and its class: public, internal, personal, financial}} |
| Authentication and authorization | {{who is allowed to do what; permission names}} |
| Inputs | {{untrusted inputs and how each is validated or escaped}} |
| Secrets | {{secrets touched and where they live; never their values}} |

## Rollback

<!-- The rollback command and the verify command, each in backticks, plus data handling. -->

1. Command: {{`rollback command`}}
2. Verify: {{`verify command`}} returns {{expected output}}.
3. Data: {{what happens to data written while the change was live}}.

## Release & observability

<!--
Mechanism 12.1 / K2: observability is defined here, before release; Operate monitors it.
Standard/Full: every row is required. Quick with a production deploy: Signal and Rollback command.
Signal names the AC it observes. Alert = comparator + number + unit + window + channel.
Rollout = feature flag with default off, or stages 1% → 10% → 100%.
-->

| Item | Value |
|---|---|
| Signal | {{metric or log event name}} · {{AC-n}} |
| Alert | {{metric > number unit over N min}} → {{channel}} |
| Dashboard or query | {{dashboard path or saved query name}} |
| Owner | {{role that receives the alert, and the person}} |
| Rollout | {{flag name, default off; stages 10% → 100%}} |
| Rollback command | {{`rollback command`}} |

## Indicator

<!-- The outcome this change must move. Baseline and target are numbers; first reading ≤ 7 days after release. -->

| Indicator | Baseline | Target | Method | First reading |
|---|---|---|---|---|
| {{name}} | {{number + unit, date measured}} | {{number + unit}} | {{query or source}} | {{release date + ≤ 7 days}} |

## Open questions

<!--
Zero open questions, or each one ends with "deferred: <owner role>" and the date it is due.
Write "None." when every question is answered.
-->

None.

## Revision log

<!--
One row per revision; Rev 1..N contiguous; the last Rev equals the header Revision.
Critique (mechanism 2.4): "<fresh-context | self-review> · 12/12 · <findings fixed> fixed, <n> open".
-->

| Rev | Date | Change | Requested by | Critique |
|---|---|---|---|---|
| 1 | {{YYYY-MM-DD}} | First draft | {{role}} | {{fresh-context · 12/12 · n fixed, 0 open}} |

## Approvals

<!--
references/governance.md §Approval record. Excluded from the spec hash, so appending rows never
changes it. Hash = `spec-lint --hash` output at the time of the decision. Sign-off values: "Specify",
or "Specify + Design (combined)" on the Standard path with ≤ 5 plan tasks. Only an explicit "yes" or
"approved" given by the named role in a later turn than the request counts. Earlier rows stay as
history; the last Spec row is the binding one. Gate before Build:
  spec-lint --check-approval specs/NNN-slug/spec.md
-->

| Sign-off | Rev | Hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|

### Waivers

<!-- references/governance.md §Waivers. Inside ## Approvals, so recording a waiver does not change the spec hash. -->

| ID | Kind | Gate waived | Severity | Reason | Requester | Owner | Granted | Expires | Follow-up |
|---|---|---|---|---|---|---|---|---|---|
