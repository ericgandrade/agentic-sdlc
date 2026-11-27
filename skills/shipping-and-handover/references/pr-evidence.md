# PR evidence — visual, before/after, door, rollback, Verification rows

Load at Step 3 of `SKILL.md`. Format authority: `../agentic-sdlc/templates/pr-body.md`; evidence rules: `../agentic-sdlc/references/verification.md`. This file adds how to fill the Developer's part well. Paths starting with `../agentic-sdlc/` are relative to this skill's folder.

## 1. What the Developer writes, and what it does not

| PR section | Developer at PR open | Reviewer in Test |
|---|---|---|
| Header lines | Fills all | Updates head SHA and fingerprint per round |
| `## Summary` + Visual, Before / After, Door, Rollback | Fills | Treats as testimony |
| `## Verification` | Own rows, `By: Developer`; Docs row; CANNOT_VERIFY table | Re-runs every command; `By: Reviewer` rows are the ones that count |
| `## Trace`, `## Review triage`, `## Review guide` | `pending — Reviewer` | Fills |
| `## Waivers` | Existing rows or `none` | Adds as needed |

Without a PR host, the same body is committed as `specs/NNN-slug/review.md` (Quick: `docs/reviews/<issue>.md`) on the feature branch. Review records are excluded from the fingerprint, so this commit does not stale the evidence.

## 2. Summary prose

2–5 lines. Each sentence names the AC it serves. State what is deliberately absent when a reader would expect it ("No customer fields are read or written."). No narrative of how the work went; no adjectives ("robust", "clean").

Good: `Adds CSV export of the filtered orders (AC-1) with formula-injection escaping (AC-2), the reports:export check (AC-3) and a 50,000-row limit (AC-4). Flag reports.csvExport defaults to off.`
Bad: `Implemented the export feature with a robust and scalable design after several iterations.`

## 3. Visual — pick the smallest view

One view, two at most, ≤ 15 lines each, placed directly under the prose.

| The change is mostly… | Use | Example |
|---|---|---|
| A new or changed interface | `diff` block of the signature or route | `+ GET /api/reports/export?<filters> → 200 text/csv · 403 · 422` |
| Logic | Pseudocode of the decision | `if rows > 50_000 → 422, no body; else stream` |
| Runtime flow across modules | Call tree | `ExportButton → api.exportCsv → route export.ts → csv.serialize` |
| UI structure | Component tree with paths and state | `ReportsPage › Toolbar › ExportButton (hidden without reports:export)` |
| Refactor or move | Shallow file tree, before and after | 2 levels max |
| Interaction between services | Sequence diagram (Mermaid text) | ≤ 8 messages |

Show a whole block only when most of it is new. Never paste the full diff; the reviewer has it.

## 4. Before / After evidence

Evidence of the **behaviour**, not of the code. Tiers, strongest first:

| Tier | When | Form |
|---|---|---|
| Screenshot pair | Any visible UI change and an environment that renders it | Two image paths in the repository or PR attachments, each captioned with commit SHA and the steps taken; same viewport, same data |
| Execution pair | Everything else | The same command at the base commit and at the head, output trimmed to the lines that differ: an acceptance test red → green, an HTTP status, a CLI output |
| Recording | Multi-step interaction where order matters | Short clip path + the steps; supplements a screenshot pair, never replaces the execution pair for an AC |

Format:

```text
Before (main @ 9e1d4c2):  curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/reports/export → 404
After  (head @ 1b8d74a):  curl -s -o /dev/null -w "%{http_code}" -H "Cookie: <test session>" localhost:3000/api/reports/export → 200
```

Rules: real output, copied; the "before" really ran at the base commit (a `git worktree add` of the base or a stash-free checkout), never reconstructed; synthetic test data only (rule 7: no personal, health or client data in screenshots); a pure refactor writes `Before / After: no behaviour change — <the test command that passed at both commits>`.

## 5. Door classification

| Door | Definition | Examples | Consequence |
|---|---|---|---|
| **two-way** | The spec's rollback command restores the previous behaviour, and data written while the change was live stays usable by the old code | Flag off; `git revert` of a code-only change; additive column the old code ignores (expand step) | Normal path rules |
| **one-way** | Undo loses or corrupts data, or cannot reach people already affected | Column or table dropped (contract step); data rewritten in place; emails, webhooks or payments sent; public field or endpoint removed; key rotation that invalidates sessions | `irreversible` risk trigger → Full path; ADR Consequences must say one-way; the migration guide and the release notes Rollback **Data** line state what cannot be undone |

Decision procedure: read `spec.md` §Rollback item 3 (Data). "No data written" or "old code reads new rows" → two-way. Anything else → one-way unless the PR shows a tested down step (P12). A disagreement with the ADR's Consequences line → L2 finding for the Reviewer; do not edit the ADR from the PR.

**Blast radius** sits beside the door: one phrase naming what else the change can break — consumers of a changed contract, shared components, layout on other pages, mobile widths, jobs reading the same table. Derive it from P9's file list and the callers of changed symbols (`git grep`, or the project codemap when one exists), not from memory.

Line format under the Summary:

```text
Door: two-way — flag reports.csvExport off restores the previous page; the export writes no data.
Blast radius: reports page only — no shared component, schema or public API consumer changes.
Rollback: `flagctl set reports.csvExport off --env prod` · Verify: `curl -s -o /dev/null -w "%{http_code}" https://reports.example.test/api/reports/export` → 404 within 60 s
```

The rollback and verify commands are copied verbatim from `spec.md` §Rollback (Quick: from the issue's `Observability: <signal> · rollback: <command>` line). A PR whose rollback differs from the approved spec → the spec changes through the change protocol, or the PR changes.

## 6. Verification rows (Developer's own)

| Rule | Detail |
|---|---|
| One row per `sdlc-dod` key | lint, typecheck, test, coverage — `n/a — <reason>` only when `sdlc-dod` says so |
| ≥ 1 row per AC | Test IDs and names carry the AC ID; several tests of one AC may share a row (`AT-1a, AT-1b (+1)`) |
| Docs row | Pages changed + `<docs build> && <link check>`, or `n/a — no user-visible change` |
| Exit | Copied from the shell; coverage as `0 (84.1 ≥ 78.4)` |
| Fingerprint | Same 12 hex on every row; computed before and after the run |
| Time | ISO-8601 with offset |
| By | `Developer` (or `self-review` when the platform forced a single context) |
| Excerpts | Last ≤ 40 lines per command, inside the collapsed block, each headed `$ <command>   # ID: <AC-n \| DoD:key> · fingerprint <12 hex>` |

CANNOT_VERIFY row: AC · Critical (yes/no) · reason (production-only data, third-party without sandbox, hardware, human judgement) · checked instead · verifier role + person · when (≤ 14 days after release) · waiver ID (required when Critical). More than half the ACs CANNOT_VERIFY → stop; the item returns to Design for test seams.

## 7. Review guide readiness (for the Test sign-off)

The Reviewer fills `## Review guide`; before the Test sign-off request this skill checks it is usable (mechanism 5.7):

- Files ordered riskiest first, each with the reason (risk trigger, security, data, public interface).
- 3–7 questions, each tied to a file, an AC or a declined-to-judge finding; no question answerable from the diff alone.
- CANNOT_VERIFY items with verifier and date, or `none`.
- Self-review labels, or `none`.
- Deferred findings with issue numbers, and waivers, or `none`.

Missing item → the Test sign-off request waits. `approval-check --pr` checks the sign-off rows and waivers, not these items.

## 8. Anti-patterns

| Anti-pattern | Fix |
|---|---|
| "Tested locally, works" | A Verification row with command, exit, fingerprint |
| Screenshot of the IDE or a green CI badge | Screenshot of the behaviour, or the command output |
| Door left blank on a "small" change | Every PR states the door; small changes are usually two-way, and saying so costs one line |
| Rollback "revert the PR" when the spec names a flag | Copy the spec's command |
| Summary that lists files | The visual covers structure; the summary covers behaviour |
