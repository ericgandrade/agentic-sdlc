# Architecture Decision Records — Test, Format and Lifecycle

Load at Workflow Step 4 (decide what becomes an ADR and write it), when superseding or deprecating an existing ADR, and when a reviewer questions whether an ADR was needed. The contract is `../../agentic-sdlc/references/artifacts.md` §ADR; this file adds the test, the procedure and examples. The three-condition test adapts Matt Pocock's ADR format note (MIT); convention-first location and the lifecycle adapt Addy Osmani's `documentation-and-adrs` (MIT). Wording is original.

## 1. When to write one

Two gates. In the Agentic SDLC the **contract trigger** is binding; the **three-condition test** sizes the record and is the gate in standalone work.

**Contract trigger (Agentic SDLC, binding).** Write an ADR when a decision is expensive to reverse (data model, public interface, framework, deployment topology) or when ≥ 2 options were seriously compared. Full path: ADRs for every such decision; Standard path: only when the trigger fires. Quick path has no Design stage and no ADR.

**Three-condition test.** A decision deserves a full ADR when all three hold:

1. **Hard to reverse** — backing out costs more than a sprint, needs a data migration, or breaks callers outside the team.
2. **Surprising without context** — a competent engineer reading the code later would be tempted to "fix" it.
3. **A real trade-off** — a credible alternative was given up for a stated reason.

| Contract trigger | Three conditions | Action |
|---|---|---|
| fires | all 3 | Full ADR: every section, options table, consequences with one-way or two-way door |
| fires | 1–2 | Short ADR: every required section, one or two lines each |
| does not fire | all 3 (standalone or two-way door that still surprises) | Short ADR recommended; on the Agentic SDLC, a sentence in the plan `## Goal and architecture` is enough |
| does not fire | 0–2 | No ADR. The plan header says `ADRs: none — <reason>` |

**What qualifies, typically:** architectural shape (modular monolith vs services); integration pattern between modules (sync call, queue, shared table); technology with lock-in; data model and ownership; public interface style and versioning; explicit "no" decisions on scope or tech; deliberate deviation from the obvious path; constraints invisible in code (latency contract, residency, compliance); loosening a rule in `CONSTRAINTS.md` (always an ADR plus Design sign-off).

**What does not:** naming, folder layout inside a module, library choice with a drop-in replacement, a decision fully determined by an AC, anything reversible by a flag flip.

## 2. Location, numbering, convention

1. **Match the existing convention first.** Look for `docs/adr/`, `adr/`, `docs/decisions/`, `.adr-dir` (adr-tools), MADR files. Reuse the folder, numbering width, filename pattern and heading set; when two schemes coexist, report it and continue the newer one.
2. **Default** (no convention): `docs/adr/NNNN-<kebab-slug>.md`, 4-digit sequential number = highest existing + 1, folder created lazily with the first ADR. This is also the path the code map and `project-context` advertise.
3. **Numbers are never reused.** A Proposed ADR dropped before sign-off is deleted in the same plan revision and its number stays out of use.
4. **One decision per ADR.** Two independent decisions → two files.

## 3. Format

Required sections (contract): `Status` · `Date` · `Related` (spec ID and `AC-n`) · `Context` · `Decision` · `Options considered` (option · pros · cons) · `Consequences` (one-way or two-way door). Template: `../templates/adr.md`.

Writing rules:

- **Context** states forces with numbers (volumes, latency, team size, deadline, constraint IDs), not history.
- **Decision** starts with "We will …" and is enforceable: a reviewer can tell from a diff whether it was followed.
- **Options considered** carries the comparison from `design-it-twice.md`; every rejected option ends with "Rejected because …".
- **Consequences** lists positive, negative and the revisit trigger ("revisit if exports exceed 200,000 rows"), plus `one-way door` or `two-way door` with the cost of backing out.
- **Related** names the spec (`specs/NNN-slug/spec.md`) and each `AC-n` served. A decision serving no AC is suspect: either the spec is missing a requirement (route to the Analyst) or the decision is scope creep (drop it).
- A Mermaid diagram is allowed in Context or Decision when it replaces a paragraph.

## 4. Lifecycle

```text
Proposed ──(Design sign-off, explicit yes)──▶ Accepted ──(new ADR accepted)──▶ Superseded by NNNN
    │                                             │
    └─(dropped before sign-off: file deleted)     └─(no longer applies, nothing replaces it)──▶ Deprecated
```

| Status | Who sets it | Rule |
|---|---|---|
| `Proposed` | Architect | Every new ADR. Freely editable while Proposed. Listed in the plan header |
| `Accepted` | Recorded with the Design sign-off, never by an agent's own judgement | Set only after the Tech Lead's explicit yes is recorded in `plan.md` `## Approvals`; add `Accepted at Design sign-off · plan rev N · YYYY-MM-DD`. An ADR still `Proposed` after Design sign-off → Reviewer lens L2 Important finding |
| `Superseded by NNNN` | When the new ADR is accepted | The old decision text is never edited; only its Status line changes, with a link to the new ADR. The new ADR's Context links back |
| `Deprecated` | With a Design sign-off of the item that removes the need | Decision no longer applies (feature removed, constraint lifted) and nothing replaces it. Reason and date on the Status line |

`Deprecated` is used by common ADR practice but is not yet listed in the contract (`artifacts.md` §ADR names Proposed, Accepted, Superseded). Use it only for withdrawals with no replacement; when in doubt, supersede.

**Never** edit the Decision of an Accepted ADR. Changing a decision = new ADR (Proposed) in a new plan revision → Design sign-off again (`../../agentic-sdlc/references/rules.md` §Change protocol).

**ADR on rejection.** When the human rejects a recurring proposal for a load-bearing reason ("we keep one database for audit reasons"), offer a short ADR recording the "no" so later reviews do not suggest it again. Skip ephemeral reasons ("not this sprint").

## 5. ADR, waiver or CONSTRAINTS change?

| Need | Instrument | Approval |
|---|---|---|
| A lasting design choice | ADR | Design sign-off (Tech Lead) |
| Loosening a quality rule permanently | ADR + `CONSTRAINTS.md` edit | Design sign-off; a diff that weakens the file without both → Critical finding |
| Proceeding despite a failed gate for a while | Waiver (`accept-risk` or `defer` ≤ 30 days; `emergency` ≤ 7 days), never for a Critical item except `emergency` | Waiver owner ≠ requester (`../../agentic-sdlc/references/governance.md` §6) |
| A new dependency | `plan.md` `## Dependencies` row (rule 10); an ADR too when it is a framework or carries lock-in | Design sign-off |

## 6. Examples

**Good (short ADR, trigger fired by comparison):**

```markdown
# 0007. Stream invoice exports from the request instead of a background job

- Status: Proposed
- Date: 2026-11-24
- Related: specs/014-invoice-export/spec.md · AC-3, AC-4

## Context
200,000 invoices per month maximum; AC-3 requires first byte within 2 s at p95. Gateway timeout is 60 s.

## Decision
We will stream CSV rows from `GET /invoices/export` behind flag `invoices.export`, counting rows before the first byte.

## Options considered
| Option | Pros | Cons |
|---|---|---|
| Streaming endpoint | No new runtime parts; meets AC-3 | Long requests near the timeout. Chosen |
| Background job + link | No timeout risk | New queue, bucket and retention of financial data. Rejected because it adds a store of Financial data for no AC |
| Nightly report job | Exists | Rejected because it fails AC-3 |

## Consequences
Two-way door: flag off and route removal. Revisit if staging shows p99 > 45 s on 200,000 rows.
```

**Bad:** "ADR-12: Use PostgreSQL. We chose PostgreSQL because it is reliable and scalable." No context with numbers, no options, no AC, no door, nothing a reviewer can enforce.

## 7. Review checklist (before the sign-off request)

1. Every decision meeting the contract trigger has an ADR; the plan header lists all, or `none — <reason>`.
2. Each ADR: all required sections, Status `Proposed`, `Related` names spec and ≥ 1 `AC-n`.
3. Decision is enforceable from a diff; Consequences name the door and a revisit trigger.
4. No ADR edits the Decision of an Accepted ADR; supersession links both ways.
5. No ADR adds scope beyond the approved spec.
