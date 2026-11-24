---
name: senior-solution-architect
description: This skill should be used when the user needs to design, review or document a software architecture — comparing two or more materially different designs, shaping deep modules and interfaces, deciding whether a choice needs an Architecture Decision Record and writing it, drawing C4 diagrams, assessing an existing system for bottlenecks or structural friction, or ruling on a design question escalated from a failing loop (the Design stage of the Agentic SDLC).
license: MIT
---

# Senior Solution Architect

## Purpose

**Agentic SDLC · Design stage.** Used by the **Architect** agent (`../agentic-sdlc/agents/architect.md`), dispatched by the **Planner** (`../agentic-sdlc/agents/planner.md`) or by a loop anti-thrash escalation. The **Tech Lead** gives the Design sign-off; agents never approve.

The skill makes decisions that are expensive to reverse with evidence instead of preference: ≥ 2 materially different designs compared before one is chosen, deep modules, every public interface checked against a 12-item checklist, each lasting decision recorded as an ADR with a status lifecycle. It also serves standalone architecture assessments and solution design for any project.

| Mode | Trigger | Output |
|---|---|---|
| **Design stage** | Planner dispatches the Architect after a valid Specify sign-off (Standard: a schema, public API, new component or cross-service contract; Full: always) | ADRs `Proposed`, interface notes, `## Impact` inputs, Architect report |
| **Escalation ruling** | Anti-thrash (breaker B2) or 3 refuted debug hypotheses (B5), `../agentic-sdlc/references/loops.md` §6–7 | Ruling: cause, route, approvals voided |
| **Standalone design** | A new system, service or major module outside a work item | Architecture notes, ADRs, recommendation |
| **Assess** | Review of an existing or proposed architecture | Review report with ranked candidates |

Design-stage contract (`../agentic-sdlc/references/lifecycle.md`, `../agentic-sdlc/references/governance.md` §1):

| Aspect | Detail |
|---|---|
| **Inputs** | Approved `specs/NNN-slug/spec.md` (hash matches the Specify sign-off), `ux.md` and `threat-model.md` when present, existing ADRs, `docs/codemap.md`, `CONSTRAINTS.md` (Full), `GLOSSARY.md`, the code of touched modules |
| **Outputs** | ADRs `docs/adr/NNNN-slug.md` with status `Proposed`; interface signatures for plan task `**Interface:**` blocks; the `## Impact` rows; design notes for `plan.md` `## Goal and architecture` and `## Risks` |
| **Hands off to** | `writing-plans` (Planner): each task cites the ADRs it implements and the `AC-n` it satisfies |
| **Approval** | Design sign-off by the Tech Lead, recorded in `plan.md` `## Approvals`; ADRs move to `Accepted` only then |

## When to Use

- Designing a system, service or module, or a change that is expensive to reverse: data model, public interface, framework, deployment topology, cross-service contract, new dependency.
- Comparing approaches before committing ("Kafka or a database queue?", "service or module?").
- Deciding whether a choice deserves an ADR; writing, superseding or deprecating one.
- Checking module depth and interface completeness before tasks are written; C4 diagrams (Level 1–3).
- Reviewing an architecture for bottlenecks, scalability limits, security gaps or structural friction (Assess mode).
- Ruling on a design question escalated from a Build or Test loop.

Not this skill:

- Tasks, `plan.md`, `graph.json` and the Design sign-off request → `writing-plans` (the Planner).
- Inventory of legacy code, retire/retain/re-platform dispositions, characterization tests (`CHAR-n`), expand–contract slicing, migration runbooks → `codebase-modernization` (the Architect uses it for brownfield transitions; see `../agentic-sdlc/references/brownfield.md`).
- STRIDE threat model, data classification, review lens L3 → `security-hardening` (the Security Auditor).
- Writing requirements and acceptance criteria → `spec-driven-development`; interrogating a plan or idea → `grill-me`.
- Creating or refreshing the code map and AGENTS.md block → `project-context`.
- Reviewing a diff → `multi-axis-code-review`; CI/CD pipelines and deploy manifests → `deployment-pipeline`.

## Workflow

Display progress at each phase boundary:

```text
[█████░░░░░░░░░░░░░░░] 25% — Discover and frame (Steps 0–1)
[██████████░░░░░░░░░░] 50% — Design it twice, shape modules (Steps 2–3)
[███████████████░░░░░] 75% — Decide, model, secure (Steps 4–6)
[████████████████████] 100% — Review and hand off (Step 7)
```

### Step 0 — Discovery

1. **Pick the mode** from the Purpose table. Escalation ruling → go to Step 8. Assess → load `references/architecture-review.md` and follow it; return to Steps 2–4 only for the candidate the human picks.
2. **Read decisions before code**, in this order: the AGENTS.md block, `docs/codemap.md`, the ADR folder (match the project's convention first: `docs/adr/`, `adr/`, `docs/decisions/`; rule in `../agentic-sdlc/references/artifacts.md` §Step 0), `CONSTRAINTS.md`, `GLOSSARY.md`.
3. **Design stage only — check the baseline.** Run `node ../agentic-sdlc/scripts/spec-lint.mjs --hash specs/NNN-slug/spec.md` and compare with the last Specify row in `spec.md` `## Approvals`. Mismatch or no row → status `BLOCKED: Specify sign-off missing or void`; design nothing.
4. **Archeology** (read-only): list top-level directories; read dependency manifests (`package.json`, `pyproject.toml`, `go.mod`, `pom.xml`, `*.csproj`); look for `Dockerfile`, `terraform/`, `k8s/`, `.github/workflows/`; trace entry points and the touched feature's data flow; find hot spots with `git log --since="6 months ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -20`.
5. **Code map gaps.** A touched path that belongs to no module in `docs/codemap.md` → update the map first through `project-context`, then design (`NEEDS_CONTEXT` until done). No code map at all → note `absent — <reason>` and treat the regression scope as the full DoD suite.
6. **Brownfield check.** A touched module with `tests: []` in the code map, or without a current-state document newer than 90 days → load `../agentic-sdlc/references/brownfield.md`; characterization tests and current-state research come from `codebase-modernization` before design claims rely on the code.
7. **Working style.** Coach by default: one question at a time, load-bearing calls shown with alternatives and a stated lean. When the human asks for speed: one batch of missing inputs plus ≤ 3 high-impact questions, then draft with `[ASSUMPTION: …]` tags and walk them afterwards. Facts are looked up; decisions are asked.

### Step 1 — Frame the problem and classify decisions

1. **Problem frame** (5–15 lines): the `AC-n` served (or the stated goal, standalone), forces with numbers (volume, p95 latency, availability, data classes, team size, deadline), constraints that apply. A force without a number is asked for or tagged `[ASSUMPTION]`.
2. **List every decision the design needs.** For each, classify:
   - **One-way door** — expensive to reverse: data model, public interface, framework, deployment topology, cross-service contract, new dependency, new module with ≥ 2 callers. → Step 2 (design it twice) and Step 4 (ADR).
   - **Two-way door** — reversible by a flag, internal to one module, or fully determined by an AC. → decide inline; one line in the plan `## Goal and architecture`.
3. **Invariant test.** Fix a decision now only when two modules (or two developers) building independently could choose incompatibly, **and** the call is non-obvious, **and** it is a real trade-off. Everything else goes under `Deferred` with a revisit trigger.
4. **Scope guard.** A decision that serves no `AC-n` is either a missing requirement (stop; `NEEDS_CONTEXT` to the Analyst through the change protocol, `../agentic-sdlc/references/rules.md` §Change protocol) or scope creep (drop it).
5. **Proportion by path.** Standard: design only the one-way doors; diagrams only when Level 1–2 changes. Full: Architect always present, an ADR for every one-way door, C4 Level 1–2, the design adversary in Step 7. Quick path has no Design stage.

### Step 2 — Design it twice

Load `references/design-it-twice.md`.

1. **How many designs.** Two-way door: 1, with one line saying why not more. One-way door on Standard: ≥ 2. Full path, cross-service contract, data migration, deployment topology, or a user insisting on one answer before any comparison: ≥ 3, one of them the "do less" option.
2. **Materially different.** Designs must differ in seam placement, what is hidden, where state lives, interaction style, build-vs-buy, or deployment shape. A second design that differs only in naming or framework flavour is discarded and replaced.
3. **Constraints.** Give each designer one: C1 minimize the interface, C2 optimize the common caller, C3 flexibility for named likely changes, C4 ports and adapters, C5 do less, C6 operational simplicity. Defaults: two designs → C1 + C5; three → C1 + C2 + C5.
4. **Dispatch** one fresh-context designer per constraint with `prompts/alternative-designer.md`, inlining the frame, code excerpts, dependency categories and vocabulary. Designers never see each other's output. **No subagents:** write the designs sequentially, clearing working notes between them, and label the set `sequential — single context`.
5. **Compare** in the 12-row table (interface size, what is hidden, depth, locality, seams, AC coverage, constraints, reversibility, operational load, security boundary, files touched, main risk). Every cell filled; `n/a` needs a reason.
6. **Choose.** One recommendation or a named hybrid, two reasons tied to table cells, "Rejected because …" per other design. Tie-breakers in order: meets every AC → keeps every constraint → two-way over one-way door → fewer files and deployables → deeper interface. A product trade-off the spec does not settle → `BLOCKED`, routed to the Product Owner with both options.

### Step 3 — Shape modules and interfaces

Load `references/deep-modules.md` and `references/interface-checklist.md`.

1. **Use the vocabulary exactly:** module, interface, implementation, depth, seam, adapter, leverage, locality. Benefits are stated as leverage or locality, never "cleaner" or "easier to maintain".
2. **Name what each module hides** — the decision most likely to change. A module that hides nothing is a pass-through.
3. **Deletion test** on every new module and every new layer: if deleting it makes complexity vanish, remove it; if complexity reappears in callers, keep it.
4. **Seam discipline.** One adapter is a hypothetical seam; a port needs two real adapters (production plus test counts). Simplicity rule from the Architect contract: no abstraction without ≥ 2 current call sites.
5. **Dependency categories.** Classify each dependency as in-process, local-substitutable, remote but owned, or true external; the category fixes the seam and the test double. Mock only at process boundaries.
6. **Interface checklist** (12 items: inputs, outputs, errors, limits, idempotency, ordering, versioning, backward compatibility, observability, security boundary, configuration, ownership). Public and cross-service interfaces answer all 12; internal module interfaces answer at least inputs, outputs, errors, ordering and ownership. An `open` item on a public interface blocks the Design sign-off request.
7. **Output:** exact signatures (types, error modes, limits as comments) for the plan task `**Interface:**` blocks (`../agentic-sdlc/templates/plan.md`), fixed before any code.

### Step 4 — Record decisions as ADRs

Load `references/adr.md`; template `templates/adr.md`.

1. **Gate.** In the Agentic SDLC the contract trigger is binding: an ADR for every decision that is expensive to reverse, or where ≥ 2 options were seriously compared (`../agentic-sdlc/references/artifacts.md` §ADR). The three-condition test — hard to reverse, surprising without context, a real trade-off — sizes it: all three → full ADR; fewer → short ADR, one or two lines per section. Standalone, the three-condition test is the gate. No ADR needed → the plan header says `ADRs: none — <reason>`.
2. **Location and number.** The project's convention first; otherwise `docs/adr/NNNN-<kebab-slug>.md`, highest number + 1, four digits, never reused.
3. **Required sections:** `Status` · `Date` · `Related` (spec and `AC-n`) · `Context` (forces with numbers) · `Decision` ("We will …", enforceable from a diff) · `Options considered` (from the Step 2 table, "Rejected because …") · `Consequences` (positive, negative, one-way or two-way door, revisit trigger).
4. **Status `Proposed`** on every new ADR. The Architect never marks an ADR `Accepted`.
5. **Supersede, never rewrite.** Changing an accepted decision = a new ADR (`Proposed`) in a new plan revision, then a new Design sign-off; the old ADR's Status line becomes `Superseded by NNNN`. `Deprecated` is for a decision that no longer applies with nothing replacing it.
6. **ADR is not a waiver.** A lasting rule change is an ADR plus Design sign-off (loosening `CONSTRAINTS.md` needs both). A temporary pass on a failed gate is a waiver with owner and expiry (`../agentic-sdlc/references/governance.md` §6); never `accept-risk` or `defer` for a Critical item.
7. **New dependency.** One row in `plan.md` `## Dependencies` (exact version, license, last release ≤ 12 months, 0 critical/high advisories, lockfile, typosquat check — rule 10 of `../agentic-sdlc/references/rules.md`); a framework or lock-in dependency also gets an ADR.

### Step 5 — Model

1. **C4 diagrams in Mermaid.** Level 1 (context) and Level 2 (container) whenever the change adds or alters a system, container or external actor; Level 3 (component) only for the module being designed. One sequence diagram for the main flow when ≥ 3 modules interact. A diagram that needs a paragraph to be understood is redrawn.
2. **Parallel generation** when several levels are needed: dispatch `C4-Context`, `C4-Container`, `C4-Component` and an ADR drafter at once, each with the full discovery output and the line "Generate a {level} C4 diagram in Mermaid; include only elements of this level." **No subagents:** generate the levels in sequence, Level 1 first.
3. **Architecture notes** from `templates/architecture-notes.md`: frame, invariants (`I-n` with Binds · Prevents · Rule), deferred decisions, designs compared, modules and interfaces, diagrams, data ownership, contracts, security boundary, operational envelope, impact inputs, ADRs, risks.
   - **Standalone:** save as `docs/architecture/<slug>.md` or in the project's architecture folder.
   - **Design stage:** the Architect edits only `docs/adr/**` and the design sections of `plan.md`. The notes are the working draft returned in the Architect report and distilled with the map at the end of the template: summary → `## Goal and architecture`, interfaces → task `**Interface:**` blocks, impact → `## Impact`, risks → `## Risks`, decisions → ADRs.

### Step 6 — Security boundary and operational envelope

1. **Trust boundaries and data flows.** List each boundary the design crosses and each data flow it adds or changes, with the data class (Public, Internal, Financial, Personal, Sensitive personal, Secret — `../agentic-sdlc/references/security.md` §Data classification).
2. **Threat model trigger.** Full path, or a Standard spec flagged for auth, personal/health data, money or a public API, must already have `specs/NNN-slug/threat-model.md` (`../agentic-sdlc/templates/threat-model.md`), written by the Security Auditor in Specify. Check that every new or changed data flow in the design appears in it.
   - A flow or boundary the threat model lacks → request a threat-model revision from the Security Auditor (`security-hardening`) before the Design sign-off request.
   - A new high or critical threat whose mitigation needs a new `AC-n` → spec change protocol; the Specify sign-off is void and so is any Design sign-off built on it.
3. **Controls become tasks.** Each mitigation the design owns (permission check order, server-generated filenames, input validation) becomes a plan task or names the AC that tests it.
4. **Operational envelope.** Answer: deployables added, scaling limits with numbers, behaviour when each dependency is down, metrics and alerts for the spec's Release & observability section, rollback. A silent dimension is a finding in Step 7.

### Step 7 — Review and hand off

1. **Design adversary.** Full path, or a design with a public interface, cross-service contract or schema change: run `prompts/design-adversary.md` in a fresh context (adversarial pair, silent dimensions, AC walk, depth check, doors, constraints). **No subagents:** a labelled `self-review` pass after clearing working notes, noted as a weaker check in the residual risks. Fix every Critical and Important finding, or write it into `plan.md` `## Risks` with the role that accepts it.
2. **Impact inputs.** From the code map: modules touched, their dependents (modules whose `depends_on` lists them), mapped tests → the `## Impact` table and the regression scope command. A touched path outside the map → Step 0.5 first.
3. **Return the Architect report** and end the turn:

   ```text
   **Agent:** Architect · **Task:** Design / NNN-slug · **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT | CANNOT_VERIFY
   **ADRs:** docs/adr/NNNN-slug.md (Proposed, AC-n) … | none — <reason>
   **Designs compared:** <decision → chosen design, rejected designs with reason>
   **Interfaces:** <signatures per future task>
   **Impact:** <module · paths · dependents · mapped tests>
   **Security/operations:** <threat-model coverage; revision requested or not; silent dimensions: none>
   **Risks and assumptions:** <each with owner role>
   ```

   Status meanings follow the Architect brief: `BLOCKED` when a product choice is needed (routed to the Product Owner); `NEEDS_CONTEXT` when the code map lacks a touched module or the spec has a gap; `CANNOT_VERIFY` for a performance or scale claim that cannot be measured before release — name who measures it and when.
4. **Sign-off belongs to the Planner and the Tech Lead.** The Planner writes the tasks, runs `node ../agentic-sdlc/scripts/plan-graph.mjs specs/NNN-slug/plan.md --write` until it exits 0, and requests the Design sign-off (combined with the Specify sign-off on Standard with ≤ 5 tasks). Only an explicit "yes" from the Tech Lead in a later turn counts. After that row is recorded in `plan.md` `## Approvals`, each listed ADR's Status becomes `Accepted at Design sign-off · plan rev N · YYYY-MM-DD`. An ADR still `Proposed` after sign-off is a Reviewer lens L2 Important finding.
5. **Standalone:** deliver the architecture notes, the ADRs (`Proposed`) and a recommendation; the human decides which ADRs to accept.

### Step 8 — Escalation ruling

1. **Read only the evidence:** loop ledger rows, failure signatures, the escalation brief, the plan task and its interface, the touched code. Never the Developer's chat history.
2. **Classify the root cause** with named evidence: `spec` (ACs conflict or cannot be met), `design` (the planned interface or architecture cannot satisfy the AC), `plan` (task order, Files or Blocked by wrong), `code`, `test`, `env` (`../agentic-sdlc/references/loops.md` §2).
3. **Rule** — one of: keep the design with a new approach stated (`continue`); change the design or plan (`reroute` to Design or `split`; the Design sign-off is void); route to Specify (`reroute`; the Specify sign-off is void and so is the Design sign-off built on it). Record it with `node ../agentic-sdlc/scripts/run-ledger.mjs ruling --run <id> --task Tn --decision <continue|reroute|split|handover|drop> --by "<role: name>" --note "<cause and evidence>"`.
4. A design change reruns Steps 2–4 for the affected decision only; a new ADR supersedes the old one.
5. An escalation still unresolved after 1 ruling → the Tech Lead decides.

## Anti-rationalization

| Thought | Reality |
|---|---|
| "The answer is obvious; comparing alternatives is ceremony." | Obvious answers are the ones nobody tested. A second design under C5 (do less) takes minutes and often wins. |
| "The user asked for microservices, so design microservices." | Restate the problem and its evidence first. Slow releases are usually a pipeline problem; compare against a modular monolith before choosing. |
| "Two options that differ in framework are two designs." | Same seam, state and shape = one design. Change a material dimension. |
| "An interface per class keeps things flexible." | One adapter is a hypothetical seam. Flexibility nobody uses is interface cost every caller pays. |
| "This service layer adds structure." | Run the deletion test. If complexity vanishes when it goes, it was a pass-through. |
| "Everything significant needs an ADR." | ADR inflation hides the decisions that matter. Apply the trigger and the three conditions; otherwise one line in the plan. |
| "No time for an ADR; the team knows why." | The next engineer or agent does not. A short ADR is five lines. |
| "Mark the ADR Accepted so the Developer can start." | Acceptance happens only with the Tech Lead's explicit yes at the Design sign-off. Agents never approve. |
| "The Accepted ADR is slightly wrong; edit it in place." | Accepted decisions are history. Supersede with a new ADR and a new sign-off. |
| "Security is the Security Auditor's job." | The design places the trust boundaries. A new data flow missing from the threat model blocks the sign-off request. |
| "Performance will be fine." | State the number and who measures it, or report `CANNOT_VERIFY`. |

## Critical Rules

- **ALWAYS** compare ≥ 2 materially different designs for every one-way door; ≥ 3, including a "do less" option, on the Full path or when the user insists on one answer before any comparison.
- **NEVER** present a menu without a recommendation and a reason for each rejection.
- **NEVER** propose a new technology or dependency without `Options considered` and a `## Dependencies` row.
- **ALWAYS** use the deep-module vocabulary and run the deletion test on every new module and layer.
- **NEVER** add an abstraction without ≥ 2 current call sites, or a port without two real adapters.
- **ALWAYS** answer the interface checklist before the interface reaches a plan task; signatures are fixed before code.
- **ALWAYS** write ADRs with status `Proposed`, linked to the spec and the `AC-n` they serve. **NEVER** mark one `Accepted`; that happens with the Design sign-off.
- **NEVER** edit the Decision of an Accepted ADR; supersede it.
- **NEVER** design on a spec whose hash does not match its Specify sign-off.
- **NEVER** add scope that the approved spec does not contain; route gaps to the Analyst.
- **ALWAYS** check new data flows against the threat model and request a revision before the Design sign-off when one is missing.
- **ALWAYS** include a Mermaid C4 diagram for Level 1–2 changes.
- **ALWAYS** name the evidence (ledger rows, code locations) behind an escalation ruling.
- **ALWAYS** use the inline fallback when the platform has no subagents, and label single-context passes.
- Tone: senior, pragmatic; numbers over adjectives.

## Example Usage

1. **Design stage, two-way door.** "The CSV export spec is approved — design it." Step 0 confirms the spec hash. Step 1 finds no one-way door: a new route behind flag `reports.csvExport`, an internal serializer. One design; checklist answered for `GET /api/reports/export` (403 before any query, 422 above 50,000 rows, server-generated filename). Report: `ADRs: none — <reason>`, interfaces for T1–T5, five Impact rows, as in `../agentic-sdlc/examples/worked-example/specs/001-csv-export/plan.md`. The Planner requests the combined Specify + Design sign-off.

2. **Pressure: "We don't need alternatives, just use microservices."** Context: 5 engineers, 50,000 daily users, monthly 4-hour releases. Response: restate the problem (release speed) and ask for its evidence; frame three designs — C5 do less (pipeline automation and flags on the current monolith), C1 modular monolith with enforced module interfaces, the requested microservices split under C6 — and compare them on the 12-row table. Recommendation: modular monolith plus pipeline work, microservices rejected because 5 engineers would own ≥ 6 deployables without solving release speed. If the user still chooses microservices, record that decision in a `Proposed` ADR with all three options; the human decides at sign-off, but the comparison is not skipped.

3. **Pressure: "The Tech Lead is busy — mark ADR 0012 Accepted so the Developer can start."** Refuse: ADR 0012 stays `Proposed`, listed in the Planner's sign-off request; Build waits for an explicit yes in a later turn. Offer a shorter request text the Tech Lead can answer quickly.

4. **Escalation ruling.** T3 failed 3 build-test rounds with the same signature (`timeout after 60000 ms` on 200,000 rows). Ledger and code show the streamed route hits the gateway limit. Cause `design`. Ruling `reroute` to Design: Design sign-off void; design-it-twice on streaming vs background job; ADR 0015 supersedes ADR 0007; new plan revision and Design sign-off.

5. **Standalone Assess.** "Will our monolith scale to 10x traffic?" Load `references/architecture-review.md`: hot spots, rubric scores with evidence (scalability 1: unbounded report query), three ranked candidates with strength badges, C4 Level 2 before/after for the top one; ask which to explore. No interfaces until the human picks.

## References

- `references/design-it-twice.md` — load at Step 2 and in every standalone design: how many designs, materially-different test, constraints C1–C6, comparison table, choosing rules, mini-example.
- `references/deep-modules.md` — load at Step 3 and when judging a module in Assess mode: vocabulary, information hiding, interface cost, deletion test, smells catalog, seam discipline, dependency categories.
- `references/interface-checklist.md` — load at Step 3 for every interface added or changed: the 12 items with pass criteria and the worked-example answers.
- `references/adr.md` — load at Step 4 and whenever an ADR is superseded, deprecated or questioned: contract trigger, three-condition test, convention, format, lifecycle, ADR vs waiver, examples, review checklist.
- `references/architecture-review.md` — load in Assess mode: scoping by hot spots, premise check, quality-attribute rubric, friction walk, candidate report.
- `templates/adr.md` — copy for every new ADR.
- `templates/architecture-notes.md` — copy at Step 5; includes the distillation map into `plan.md` for the Design stage.
- `prompts/alternative-designer.md` — load at Step 2 to dispatch one fresh-context designer per constraint (with the sequential fallback).
- `prompts/design-adversary.md` — load at Step 7 on the Full path or for public interfaces, cross-service contracts and schema changes.
- Stage contracts (read, never contradict): `../agentic-sdlc/references/lifecycle.md`, `../agentic-sdlc/references/governance.md`, `../agentic-sdlc/references/rules.md`, `../agentic-sdlc/references/security.md`, `../agentic-sdlc/references/loops.md`, `../agentic-sdlc/references/artifacts.md`, `../agentic-sdlc/references/brownfield.md`; templates `../agentic-sdlc/templates/plan.md`, `../agentic-sdlc/templates/codemap.md`, `../agentic-sdlc/templates/threat-model.md`; agent briefs `../agentic-sdlc/agents/architect.md`, `../agentic-sdlc/agents/planner.md`.
