# senior-solution-architect

Designs, reviews and documents software architecture with evidence instead of preference. It compares at least two materially different designs before choosing one, shapes deep modules, checks every public interface against a 12-item checklist, and records lasting decisions as ADRs with a status lifecycle. It works standalone (architecture assessments, solution design for any project) and as the Architect in the Design stage of the Agentic SDLC, where the Tech Lead signs off the design.

## When to use

- Designing a new system, service or module, or a change that is expensive to reverse (data model, public interface, framework, deployment topology).
- Comparing approaches before committing ("queue or direct calls?", "service or module?").
- Deciding whether a choice needs an ADR; writing, superseding or deprecating one.
- Checking module depth and interface completeness before tasks are planned.
- Producing C4 diagrams (Level 1–3) and sequence diagrams.
- Assessing an existing architecture for bottlenecks, scalability limits, security gaps and structural friction.
- Ruling on a design question escalated from a Build or Test loop.

Not for: task breakdown and `plan.md` (`writing-plans`), legacy inventories and migration runbooks (`codebase-modernization`), threat modeling (`security-hardening`), spec and acceptance criteria (`spec-driven-development`).

## What is included

- `SKILL.md` — modes (Design, Assess, Rule), Design-stage contract, workflow Steps 0–8, anti-rationalization table, critical rules, examples
- `references/design-it-twice.md` — when alternatives are required, the "materially different" test, comparison table, choosing rules
- `references/deep-modules.md` — deep-module vocabulary, information hiding, deletion test, smells, seam discipline, dependency categories
- `references/interface-checklist.md` — 12 items: inputs, outputs, errors, limits, idempotency, ordering, versioning, backward compatibility, observability, security boundary, configuration, ownership
- `references/adr.md` — contract trigger plus three-condition test, location and numbering, lifecycle, ADR vs waiver, review checklist
- `references/architecture-review.md` — Assess mode: hot spots, premise challenge, quality-attribute rubric, ranked candidates
- `templates/architecture-notes.md` — frame, invariants, designs compared, modules, diagrams, data model, contracts, operational envelope, ADRs, risks
- `templates/adr.md` — minimal and full ADR template
- `prompts/alternative-designer.md` — fresh-context designer, one design per constraint
- `prompts/design-adversary.md` — adversarial review of the chosen design
- `evals/evals.json` — 6 scenarios, including pressure cases
- `evals/trigger-eval.json` — 34 queries (16 should-trigger / 18 should-not-trigger, including neighbor skills)

## Typical invocation

- "Design the invoice export for the approved spec and compare at least two approaches."
- "We want microservices — assess whether that fits a team of six."
- "Does moving to a message queue need an ADR? Write it."
- "Is this module too shallow? Review the interface."
- "Generate C4 Level 1 and 2 diagrams for our event-driven platform."

## What's New in v2.3

- **Design it twice** — at least two materially different designs, a comparison table and a recommendation with rejection reasons; parallel fresh-context designers with an inline fallback
- **Deep modules** — shared vocabulary, deletion test, pass-through and hypothetical-seam smells
- **Interface checklist** — 12 items answered before signatures go into plan tasks
- **ADR rules** — contract trigger, three-condition test, Proposed → Accepted → Superseded lifecycle; the Architect never marks an ADR Accepted
- **Architecture notes template** and **ADR template**
- **Escalation ruling** step for design questions raised by Build or Test loops
- **Assess mode reference** for standalone architecture reviews
- **Evals** — 4 new scenarios (microservices pressure, ADR acceptance pressure, shallow-module review, escalation ruling) and 14 new trigger queries

## Earlier versions

- **v2.2** — Agentic SDLC Design stage section; ADR conventions (`docs/adr/NNNN-<slug>.md`, supersede instead of edit); standard sections.
- **v2.0** — progress gauge, first evals, standardized description.

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| MP-41 | Matt Pocock skills (MIT), ideas from John Ousterhout's *A Philosophy of Software Design* | Deep-module vocabulary, information hiding | Paraphrased into a vocabulary table and smells catalog in `references/deep-modules.md` |
| MP-42, MP-43, MP-44 | Matt Pocock skills (MIT) | Deletion test, seam discipline, dependency categories | Combined with the Architect's ≥ 2 call sites simplicity rule |
| MP-46 | Matt Pocock skills (MIT), Ousterhout's "design it twice" | Multiple designs from parallel subagents | Constraint-per-designer prompt, comparison table, no-subagent fallback |
| MP-24 | Matt Pocock skills (MIT) | ADR three-condition test | Used to size an ADR after the binding contract trigger |
| MP-47 | Matt Pocock skills (MIT) | Architecture survey with hot spots and recommendation strength | Assess mode in `references/architecture-review.md` |
| AO-60, AO-62 | Addy Osmani agent-skills (MIT) | Interface principles, ADR practice | 12-item interface checklist; ADR review checklist |
| BM-43, BM-44 | BMad Method (MIT) | Spine invariants, AD-n Binds/Prevents/Rule | Invariants I-n in the architecture notes template |
| BM-45, BM-46 | BMad Method (MIT) | Coaching vs fast path with assumptions; adversarial reviewer | Working-style rule; `prompts/design-adversary.md` |
| SP-17, SP-23, SP-59 | Superpowers (MIT) | Interfaces before code; three failed fixes escalate to architecture | Interface output for plan tasks; escalation ruling step |
| — | Spec Kit (MIT), `docs/research/methods/ai-native-methods.md` §2.1 | plan, data model and contracts artifacts | Data model and contracts sections in the notes template |
| — | Kiro design.md (concept only), same doc §2.2 | Architecture and sequence diagrams in a design doc | Mermaid C4 and sequence sections |
| — | AWS AI-DLC (MIT-0), same doc §2.3 | Application design, components and decision records | Module/interface section and ADR linkage |

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 2.3.0 |
| Author | Eric Andrade |
| Created | 2026-03-01 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | architecture |
| Tags | agentic-sdlc, architecture, design-it-twice, deep-modules, interface-design, adr, c4-model, systems-design |
| Risk | safe |
