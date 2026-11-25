# NNNN. <Decision in a short active phrase>

<!--
ADR template from the senior-solution-architect skill. Contract: ../../agentic-sdlc/references/artifacts.md §ADR.
Path: the project's ADR folder if one exists; otherwise docs/adr/NNNN-<kebab-slug>.md (highest number + 1).
Required sections: Status, Date, Related, Context, Decision, Options considered, Consequences.
Short ADR (trigger fired, not all three conditions of references/adr.md §1): one or two lines per section.
New ADRs are always Proposed. Accepted is set only after the Tech Lead's explicit yes is recorded at
Design sign-off. Never edit the Decision of an Accepted ADR; supersede it.
Delete this comment when filled in.
-->

- **Status:** Proposed
  <!-- later: Accepted at Design sign-off · plan rev N · YYYY-MM-DD | Superseded by NNNN | Deprecated — <reason> · YYYY-MM-DD -->
- **Date:** YYYY-MM-DD
- **Related:** `specs/NNN-slug/spec.md` · AC-n[, AC-m] · supersedes NNNN (if any)

## Context

<Forces with numbers: volumes, latency, team, deadline, constraint IDs. What makes the decision necessary now. 3–8 lines.>

## Decision

We will <enforceable statement a reviewer can check in a diff>.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| <chosen option> | <…> | <…>. Chosen |
| <alternative> | <…> | <…>. Rejected because <reason tied to an AC, constraint or cost> |

## Consequences

- **Positive:** <…>
- **Negative:** <…>
- **Door:** one-way | two-way — <cost and steps to back out>
- **Revisit when:** <measurable trigger>
