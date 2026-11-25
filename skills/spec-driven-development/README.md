# spec-driven-development

Specify-stage skill of the **Agentic SDLC**: writes `specs/NNN-slug/spec.md` from the method's template — problem, numbered acceptance criteria (`AC-n`), measurable non-functional requirements, non-goals, security notes, rollback, release & observability, indicator — runs a fresh-context doubt pass with the 12-item checklist and a 3-round stop rule, checks the file with `spec-lint`, and requests the **Specify sign-off** from the Product Owner. The approved revision and its 12-hex hash are the build baseline; any later edit voids the approval until a new revision, with a delta that states what must not change, is approved. Used by the Product Manager (problem, stories), the Analyst (ACs, doubt pass) and the UX Designer (`ux.md`).

## When to use

- Before building any Standard or Full work item (Quick items keep 1–3 acceptance criteria in the issue).
- To turn a brainstorming brief, Product Manager brief, grill-me summary or conversation into buildable requirements.
- To make acceptance criteria and quality requirements ("fast", "secure", "accessible") testable and measurable.
- To validate a spec with `spec-lint` and a doubt pass before approval.
- To revise an approved spec with a delta (Added / Changed / Removed / Must not change).
- To split an epic into a capability map of module specs.
- To import or export Spec Kit, Kiro, OpenSpec or AI-DLC specs without creating a parallel tree.

## Modes

| Mode | Use when |
|---|---|
| create | Short interview needed |
| synthesize | Answers already exist in the conversation or brief |
| validate | Check an existing spec before the Specify sign-off |
| revise | Change a spec after a sign-off request or approval, with a delta spec |

## What's New

**2.1.0 (2026-11-24)**

- `references/ac-rubric.md` — seven AC properties, 12 good/bad pairs, unhappy-path checklist, EARS → Given/When/Then conversion, severity scale.
- `references/nfr-catalog.md` — performance, capacity, reliability, security, privacy, accessibility, observability, compliance and compatibility NFRs with measurable phrasing and the spec section where each is enforced.
- `references/capability-map.md` — epic → modules → specs, data ownership, one-way dependencies, slicing rules, Product Owner confirmation.
- `references/revise-mode.md` — delta spec format with a mandatory Must-not-change row, approval states, void rules, anti-patterns.
- `references/format-mapping.md` — import/export tables for GitHub Spec Kit, Kiro, OpenSpec, AWS AI-DLC and BMad.
- `prompts/doubt-pass.md` — fresh-context challenger (ambiguity, contradiction, testability, delta lenses) with a fixed output format and a `self-review` fallback.
- `examples/` — three specs that pass `spec-lint` with 0 warnings: a Quick-size bug fix routed to Standard by risk, a Standard public-API feature at rev 2 (passes `--check-approval`), and a Full regulated personal-data feature.
- SKILL.md: path confirmation step, Experience section and `ux.md` mapping, anti-rationalization table, References section, lint commands for vendored, repository and installed layouts.

## What is included

- `SKILL.md` — modes, discovery, path check, scope check and capability map, assumptions, spec sections, AC and NFR rules, doubt pass and stop rule, `spec-lint` step, Specify sign-off, validate and revise modes, anti-rationalization table
- `references/ac-rubric.md`, `references/nfr-catalog.md`, `references/capability-map.md`, `references/revise-mode.md`, `references/format-mapping.md`
- `prompts/doubt-pass.md`
- `examples/README.md`, `examples/031-session-idle-timeout/` (spec, threat model), `examples/044-orders-cursor-pagination/` (spec rev 2, ux, threat model, approval register), `examples/052-account-data-export/` (spec, ux, threat model)
- Uses from `agentic-sdlc`: `templates/spec.md`, `templates/ux.md`, `templates/threat-model.md`, `scripts/spec-lint.mjs`, `references/governance.md`, `references/rules.md`, `references/lifecycle.md`, `references/paths.md`, `references/adoption.md`
- `evals/evals.json` — 6 scenarios (synthesize, validate, revise, approval pressure, epic capability map, Kiro import with NFRs)
- `evals/trigger-eval.json` — 22 trigger queries (12 positive, 10 negative)

## Typical invocation

- "Write the spec for the CSV export."
- "Turn this conversation into a spec."
- "Validate this spec before we approve it."
- "Requirements changed — revise the spec and show what must not change."
- "Make 'the API must be fast and secure' measurable."
- "Spec the customer portal epic."
- "Bring our Kiro requirements into the method."

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| AO-29 | Addy Osmani — agent-skills `spec-driven-development` (MIT) | Gated spec → plan → build workflow | Gate bound to a hash-checked Specify sign-off verified by `spec-lint --check-approval` |
| AO-31 | Addy Osmani — agent-skills (MIT) | Always / Ask first / Never boundaries | Kept as the Constraints format of the template |
| AO-32 | Addy Osmani — agent-skills (MIT) | Rewrite vague requirements as measurable ones | NFR catalog with section placement; enforced by `spec-lint` V01 |
| AO-33 | Addy Osmani — agent-skills (MIT) | Scope check with a capability map | Map table with data ownership, consumers, per-module path score and PO confirmation |
| AO-34 | Addy Osmani — agent-skills (MIT) | Delta specs stating what must not change | `### Rev N delta` table with a mandatory Must-not-change row backed by an AC |
| AO-35 | Addy Osmani — agent-skills (MIT) | Defer to an existing spec tool | Format mapping; never a parallel `specs/` tree |
| AO-52 | Addy Osmani — agent-skills `doubt-driven-development` (MIT) | Fresh-context adversarial review cycle | `prompts/doubt-pass.md` with lenses, severity, 3-cycle bound |
| AO-58 | Addy Osmani — agent-skills (MIT) | Missing requirement blocks the work | Material ambiguity STOP; `NEEDS_CONTEXT` after 3 rounds |
| MP-31 | Matt Pocock — skills `to-spec` (MIT) | Synthesize from the conversation without re-interviewing | synthesize mode |
| MP-32 | Matt Pocock — skills (MIT) | Compact spec template | Mapped onto the module template's sections |
| MP-39 | Matt Pocock — skills (MIT) | "Not yet specified" vs "out of scope" | Open questions `deferred: <owner>` vs Non-goals |
| BM-49 | BMad Method (MIT) | Requirement lines with stable IDs and source citations | `AC-n` never renumbered; retired rows |
| BM-51 | BMad Method (MIT) | Two-pass self-validation: coherence, then preservation of every source requirement | Doubt-pass lens B flags any brief requirement silently dropped; lint before any request |
| BM-55/56 | BMad Method (MIT) | Epic and story slicing | Capability-map slicing rules |
| BM-59 | BMad Method (MIT) | Fresh-context validation | Challenger receives only spec, brief, ux, threat model, checklist |
| BM-62 | BMad Method (MIT) | PRD conventions: counter-metrics, specific rather than generic NFRs | Indicator counter-metric row; NFR catalog with numbers and placement |
| SP-13 | Superpowers (MIT) | Builder check: fresh reader reports only questions where a wrong guess matters, ranked | Doubt pass reports material findings by severity, with a per-AC "write the test" lens |
| SP-18 | Superpowers (MIT) | Scope check: independent subsystems become separate units | Step 2 thresholds (> 5 stories, > 15 ACs) and one spec per module |
| SP-22 | Superpowers (MIT) | Implicit expectations a spec implies but does not state | Unhappy-path checklist; unmentioned behavior becomes a question or a non-goal |
| n/a — benchmark | GitHub Spec Kit (MIT) | `spec.md` / `plan.md` / `tasks.md`, `[NEEDS CLARIFICATION]`, success criteria | Import table; markers become questions or deferred items |
| n/a — benchmark | Kiro (public format docs; no license file in the reference clone — format only, no text reused) | `requirements.md` with EARS criteria | EARS → Given/When/Then conversion table |
| n/a — benchmark | OpenSpec — Fission AI (MIT) | Change proposals with ADDED / MODIFIED / REMOVED deltas | Mapped to the delta table, plus Must-not-change |
| n/a — benchmark | AWS AI-DLC (MIT-0) | `aidlc-docs/` inception records and units of work | Units → capability map → one spec each |

All text is original; no source text was copied.

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 2.1.0 |
| Author | Eric Andrade |
| Created | 2026-11-19 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | planning |
| Tags | agentic-sdlc, specification, acceptance-criteria, requirements, spec-driven |
| Risk | safe |
