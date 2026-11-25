# Format mapping — Spec Kit, Kiro, OpenSpec, AI-DLC

Load this file when the repository already holds specs from another spec-driven tool, when a stakeholder hands over a spec in another format, or when a spec from this skill must be exported to another tool.

Contract: `../../agentic-sdlc/references/adoption.md` § 3 (existing artifact folders) and § 4 (coming from another method). Rule from that contract: with exactly one existing convention, **keep the files where they are and map them; never create a parallel `specs/` tree**. With two or more conventions, ask which one is authoritative, record the answer, and treat the others as read-only.

## 1. What every imported spec must gain

Whatever the source format, the file that plays the role of `spec.md` must end up with the parts `spec-lint` checks, so the gates work unchanged:

1. The header table (`| Field | Value |`: ID, Revision, Path, Size, Risk, Owner, Issue, Intake).
2. The required H2 sections: Problem, Users, Stories, Acceptance criteria, Non-goals, Constraints, Security notes, Rollback, Release & observability, Indicator, Open questions, Revision log, Approvals.
3. An `| ID | Criterion | Priority |` table with `AC-1..n`, each row Given/When/Then or measurable.
4. `## Approvals` with the hash of the file.

Keep the source tool's own headings *as well* when its tooling reads them (for example OpenSpec's `### Requirement:` blocks); `spec-lint` ignores unknown sections, but they count toward the word budget.

## 2. GitHub Spec Kit

| Spec Kit | Location | This module |
|---|---|---|
| `spec.md` | `specs/NNN-feature/spec.md` | Same file plays `spec.md` |
| User stories with priority (P1, P2, P3) and "Independent Test" | `## User Scenarios & Testing` | `## Stories` (one sentence each); priorities inform AC priority (`P1` paths → `critical` where data, money or access is at stake) |
| Acceptance scenarios "Given … When … Then …" | under each story | AC rows, numbered `AC-n` in story order |
| Edge cases | `### Edge Cases` | Extra AC rows (negative cases) or Non-goals |
| Functional requirements `FR-001` | `### Functional Requirements` | AC rows when user-observable; Constraints when builder rules |
| `[NEEDS CLARIFICATION: …]` markers | inline | Questions in Step 3; unresolved after 3 rounds → `## Open questions` with `deferred: <owner>`; never left inline (`???`-style markers fail P02) |
| Success criteria `SC-001` | `### Measurable Outcomes` | `## Indicator` (baseline + target) or measurable ACs |
| Assumptions | `## Assumptions` | Constraints, or Open questions when unconfirmed |
| `plan.md`, `tasks.md` | same folder | `plan.md` (Planner); `tasks.md` rows become the `## Tasks` table or stay linked |

**Import steps.** Add the header table at the top; renumber acceptance scenarios to `AC-1..n` (keep `FR-` IDs in a comment for traceability); add Non-goals, Security notes, Rollback, Release & observability, Indicator, Revision log, Approvals; run lint; run the critique; request sign-off.

**Export.** A spec from this skill maps back directly: Stories → user stories, AC rows → acceptance scenarios, Indicator → success criteria.

## 3. Kiro

| Kiro | Location | This module |
|---|---|---|
| `requirements.md` | `.kiro/specs/<feature>/requirements.md` | Plays `spec.md` |
| Introduction | `## Introduction` | `## Problem` |
| Glossary | `## Glossary` | Keep as an extra section, or fold terms into Users and Constraints |
| `### Requirement N` + `**User Story:** As a … I want … so that …` | `## Requirements` | `## Stories` |
| Numbered EARS criteria "WHEN … THE <system> SHALL …" | `#### Acceptance Criteria` | AC rows (`ac-rubric.md` § 4 converts each pattern) |
| `design.md` | same folder | `plan.md` design notes + ADRs |
| `tasks.md` | same folder | `plan.md` tasks |

**Import steps.** Keep `requirements.md` where it is. Add the header table and missing sections. Move each numbered EARS line into the AC table with an `AC-n` ID; rewrite it as Given/When/Then unless it already contains a number and a unit, because `spec-lint` AC03 accepts only those two forms. Keep the original EARS sentence in a comment above the table when the team reads both.

**Export.** Each Given/When/Then row maps to EARS: Given (state) → "WHILE", when (event) → "WHEN", then → "THE <system> SHALL".

## 4. OpenSpec

| OpenSpec | Location | This module |
|---|---|---|
| Change proposal | `openspec/changes/<change-id>/proposal.md` (`## Why`, `## What Changes`, `## Impact`) | Problem (Why), Stories + Non-goals (What Changes), delta Impact line (Impact) |
| Spec deltas | `openspec/changes/<change-id>/specs/<capability>/spec.md` with `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, `## RENAMED Requirements` | The `### Rev N delta` table (`revise-mode.md`): Added, Changed, Removed; RENAMED → Changed with old and new names |
| `### Requirement: <name>` + "SHALL" text | delta spec | AC rows (one per requirement or per scenario) |
| `#### Scenario:` with GIVEN / WHEN / THEN bullets | under each requirement | One AC row each, Given/When/Then in one sentence |
| `tasks.md` | change folder | `plan.md` tasks |
| `openspec/specs/<capability>/spec.md` | current truth | The released behavior; source of Must-not-change rows |

**Import steps.** Treat `proposal.md` + its delta specs as one spec revision. Add the header table and required sections to `proposal.md` (it becomes the linted file); copy each scenario into the AC table; add the **Must not change** rows that OpenSpec does not have — the behaviors in `openspec/specs/` the change must keep. Approve the proposal file; on archive, the approval history stays in the change folder.

**Export.** Added/Changed/Removed delta rows map to ADDED/MODIFIED/REMOVED requirement blocks; each AC becomes a `#### Scenario:`.

## 5. AWS AI-DLC

| AI-DLC | Location | This module |
|---|---|---|
| Requirements analysis | `aidlc-docs/inception/requirements-analysis/requirements.md` | Problem, Users, Constraints, NFRs |
| User stories and personas | `aidlc-docs/inception/user-stories/stories.md`, `personas.md` | Stories, Users |
| Units of work | `aidlc-docs/inception/units-generation/unit-of-work.md` | One `specs/NNN-slug/` item per unit (or one capability-map row per unit) |
| NFR requirements per unit | `aidlc-docs/construction/<unit>/nfr-requirements/` | AC rows, Constraints, Release & observability (`nfr-catalog.md`) |
| State and audit trail | `aidlc-docs/aidlc-state.md`, `aidlc-docs/audit.md` | Revision log, `approvals.md` register |

**Import steps.** Build a capability map from the units of work (`capability-map.md`); write one spec per unit, citing the inception documents as the source; keep `aidlc-docs/` read-only as history. AI-DLC's per-phase human approval maps to the Specify sign-off, which here binds a hash.

## 6. BMad PRD (for completeness)

PRD sections → one spec per capability (`capability-map.md`); FR/NFR lists → AC rows and Constraints; epics and stories → the map and Stories; architecture document → ADRs and plan design notes (`../../agentic-sdlc/references/adoption.md` § 3).

## 7. Mapping checklist

- [ ] One authoritative convention recorded; no parallel tree created.
- [ ] Header table added; Path scored with `paths.md`.
- [ ] Every criterion has an `AC-n`, is Given/When/Then or measurable, and has a priority.
- [ ] Source IDs (`FR-001`, `Requirement 3.2`, scenario names) kept in comments for traceability.
- [ ] Clarification markers resolved or moved to Open questions with an owner.
- [ ] Must-not-change rows added for any change to released behavior.
- [ ] `spec-lint` exit 0; critique 12/12; sign-off requested.
