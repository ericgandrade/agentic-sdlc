# spec-driven-development

Specify-stage skill of the **Agentic SDLC**: writes `specs/NNN-slug/spec.md` from the method's template — problem, numbered acceptance criteria (`AC-n`), non-goals, security notes, rollback, release & observability, indicator — runs an independent 12-item critique with a 3-round stop rule, checks the file with `spec-lint`, and requests the **Spec approval** from the Product Owner. The approved revision and its 12-hex hash are the build baseline; any later edit voids the approval until it is renewed.

## When to use

- Before building any non-trivial feature, change or migration.
- To turn a brainstorming brief, grill-me summary or conversation into buildable requirements.
- To validate a spec with `spec-lint` before approval, or revise one after a requirement change.
- To split a large initiative into module specs (capability map).

## Modes

| Mode | Use when |
|---|---|
| create | Short interview needed |
| synthesize | Answers already exist in the conversation or brief |
| validate | Check an existing spec before the Spec approval |
| revise | Change an approved spec via the change protocol (hash re-open rule) |

## What is included

- `SKILL.md` — scope check, assumptions, spec sections, acceptance-criteria rules, independent critique and stop rule, `spec-lint` step, Spec approval, revise and validate modes
- Uses from `agentic-sdlc`: `templates/spec.md`, `scripts/spec-lint.mjs`, `references/governance.md`
- `evals/evals.json` — 3 scenarios (synthesize, validate, revise)
- `evals/trigger-eval.json` — 14 trigger queries (8 positive, 6 negative)

## Typical invocation

- "Write the spec for the CSV export."
- "Turn this conversation into a spec."
- "Validate this spec before we approve it."
- "Requirements changed — revise the spec."

## Influences

- **Addy Osmani — agent-skills** (MIT): `spec-driven-development` — gated workflow, scope check with capability map, assumptions first, always/ask-first/never boundaries; `doubt-driven-development` — fresh-context adversarial review.
- **Matt Pocock — skills** (MIT): `to-spec` — synthesize the conversation into a spec without re-interviewing.
- **BMad Method** (MIT): `bmad-spec` / `bmad-prd` — spec creation, validation and update modes.

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-19 |
| Updated | 2026-11-22 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | planning |
| Tags | agentic-sdlc, specification, acceptance-criteria, requirements, spec-driven |
| Risk | safe |
