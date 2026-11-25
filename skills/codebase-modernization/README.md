# codebase-modernization

Specify- and Design-stage skill of the **Agentic SDLC** for brownfield code, used by the **Analyst**, **Architect**, **Planner**, **Test Engineer** and **Developer**. It makes the current state explicit before anything changes. It builds an inventory and dependency map from the code map and scores each component by value (0–9) and risk (0–12). It proposes one disposition per component (retire, retain, rehost, upgrade, re-platform, refactor, migrate) as an ADR for humans to accept. Research on how the code works today runs behind a question firewall, with `path:line @ sha` citations and a verification pass. Characterization tests (`CHAR-n`) pin current behaviour, bugs included, before untested code changes. Schema and component swaps go through expand–contract and strangler steps that each deploy and roll back alone, with a migration runbook for cutover. It implements the stage contract in `agentic-sdlc/references/brownfield.md`.

## When to use

- A legacy system needs a modernization roadmap: what to retire, keep, upgrade, re-platform, refactor or replace, and in what order.
- A change must touch code no test executes — pin it with `CHAR-n` tests first.
- A spec or design needs facts about the existing code with citations, not recollection.
- A column, table, stored format or public API changes while old consumers run.
- A component is replaced while traffic flows, or something "unused" is to be deleted.

Not for first entry into a repository (`project-context` adopt mode), implementing one task test-first (`test-driven-development`), unknown failures (`systematic-debugging`), writing the spec (`spec-driven-development`), technology selection for new systems (`senior-solution-architect`), ordinary release rollout (`deployment-pipeline`) or web research (`deep-research` from knowledge-superskills, when installed).

## What is included

- `SKILL.md` covers:
  - Step 0: preconditions and the four scope modes (portfolio, change, cutover, retire).
  - The steps from inventory through classification, disposition, firewalled research, the Specify hand-off, characterization tests, transition design, migration slices, runbook and report.
  - An anti-rationalization table, rules and five examples.
- `references/inventory-and-dependency-map.md` covers:
  - The input trust table and read-only commands for churn and active people.
  - Four dependency edge kinds and the `docs/modernization/inventory.md` format with scan coverage and freshness.
  - Refresh and reuse rules.
- `references/disposition-rubric.md` covers:
  - Value and risk scoring tables, flags and quadrants.
  - Seven dispositions with choose/reject criteria and reversibility, plus a retire checklist.
  - The record format with recommendation strength and a worked synthetic example.
- `references/characterization-tests.md` covers:
  - Target selection and the seam ladder (behaviour-neutral seam commit, sprout and wrap).
  - CHAR naming and numbering, golden master and approval files with scrubbers.
  - Mutation proof, the register, the change rule and task shape, with examples in Python and JavaScript.
- `references/expand-contract-and-strangler.md` covers:
  - Pattern choice and the six expand–contract phases with gates.
  - The seven strangler phases with dual-run rules, branch by abstraction, and adapter plus deprecation notice.
  - Exposure and rollback, feature flags, and retire at zero use.
- `references/research-firewall.md` covers:
  - Roles (locator, analyzer, historian, verifier), question shapes and the intent → factual rewrite catalogue.
  - Exclusions, reading at one commit, citation formats, verdicts and freshness.
- `prompts/current-state-researcher.md`: the firewalled researcher prompt, with inline fallback.
- `prompts/citation-verifier.md`: the fresh-context verifier prompt, with inline fallback and verdict actions.
- `templates/current-state.md`: questions, cited answers, known defects, verification summary, CHAR register, open questions.
- `templates/migration-runbook.md`: entry criteria, phase table, dual-run readings, irreversible-step evidence, deprecation notice, abort criteria, log.
- `evals/evals.json`: 5 scenarios (portfolio roadmap, change to untested code, pressure to rename in place and delete CHAR tests, strangler cutover, firewalled research).
- `evals/trigger-eval.json`: 18 trigger queries (10 positive, 8 negative).
- Uses from `agentic-sdlc`:
  - `references/brownfield.md`, `references/paths.md`, `references/tdd.md`, `references/release-ops.md`, `references/lifecycle.md`
  - `templates/runbook.md`, `scripts/run-ledger.mjs`, `scripts/plan-graph.mjs`

## Typical invocation

- "We inherited this monolith — build an inventory and tell us what to retire, upgrade or migrate."
- "Pin what `calculateTotal()` does today before we change the rounding."
- "Rename `customers.phone` without downtime."
- "Plan the cutover from the old quotes endpoint to the new pricing service, with rollback."
- "Research how order cancellation works today, with file and line citations."

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| AO-118 | Addy Osmani agent-skills `docs/adoption-guide.md` (MIT) | Brownfield verification-first: characterization tests pinning current behaviour where change is planned, before change | `CHAR-n` rule with register, mutation proof and AC-only change rule; scope modes keep pinning to the plan's footprint |
| AO-99 | Addy Osmani agent-skills (MIT) | Deprecation decision; advisory vs compulsory deprecation | Retire disposition with zero-use window, Product Owner decision when user-visible, notice type in the runbook |
| AO-100 | Addy Osmani agent-skills (MIT) | Migration process: replacement first, notice, incremental, removal; strangler, adapter, flag patterns | Strangler phase table with gates; "replace, don't layer" removal slice; adapter + deprecation section |
| AO-101 | Addy Osmani agent-skills (MIT) | Expand/contract schema migrations | Six phases, each its own deploy with rollback; contract step irreversible with own PR and Release sign-off, backup and restore evidence |
| AO-74 | Addy Osmani agent-skills (MIT) | Chesterton's Fence; Rule of 500 for mechanical changes | "Why" question before retiring odd behaviour; codemod rule above 500 call sites |
| AO-60 | Addy Osmani agent-skills (MIT) | Hyrum's Law; additive change | Observable outputs of components with > 5 consumers become CHAR targets; expand before contract |
| MP-47 | Matt Pocock skills (MIT) | Architecture survey with git-history hot-spot scoping and strength-graded candidates | Churn commands in the inventory; recommendation strength strong/moderate/weak per disposition |
| MP-45 | Matt Pocock skills (MIT) | Replace, don't layer | Every migrate/re-platform names the removal of the old path as the last roadmap slice |
| MP-26 | Matt Pocock skills (MIT) | Research against primary sources with per-claim citation | Every claim cited `path:line @ sha`; commit messages ranked below code |
| MP-64 | Matt Pocock skills `diagnosing-bugs` (MIT) | "No seam" is a finding | Missing-seam finding → `NEEDS_CONTEXT` to the Planner; smallest seam in a behaviour-neutral commit |
| BM-77 | BMad Method `bmad-deep-recon` codebase research (MIT) | Question firewall that hides intent, reading git at one commit, `path:line @ sha` citations, no recommendations | Locator/analyzer/historian/verifier roles, rewrite catalogue, exclusion list, verdicts, freshness diff, `current-state.md` template |
| BM-76 | BMad Method deep research epistemics (MIT) | Claims ledger with verification status | Verdicts verified/disputed/overturned/unverified; disputed readings kept, never averaged; no AC on unverified claims |
| SP-07 | Superpowers (MIT, Jesse Vincent) | Look before asking: recon of the repository first | Step 0 reads AGENTS.md block, code map and baseline before any question to people |
| SP-60 | Superpowers `systematic-debugging/root-cause-tracing.md` (MIT) | Backward tracing of data flow | "What touches X" question shape and data-edge mapping in the dependency map |
| — | AWS AI-DLC `inception/reverse-engineering` stage (MIT-0) | Brownfield reverse engineering: scan coverage (deep/skimmed/unopened), freshness marker with commit, reuse/rescan/focused decision, skip generated and vendored code, scan runs nothing | Inventory header `verified: date @ sha`, scan coverage line, §5 refresh table, read-only commands |
| — | GitHub Spec Kit `docs/how-to/existing-projects.md` (MIT) | Bounded first change on existing projects; compatibility boundaries stated in the spec | Scope modes (single change gets scoped research only); Step 5 puts "Preserve CHAR-a..b" and consumer constraints in `## Constraints` |
| — | Kiro steering documents (concept only; no text taken, license not stated in the clone) | Product/tech/structure notes kept beside the code | Read as `stated by` sources that still need a code citation before scoring |

Related prior work (concepts only): Michael Feathers, *Working Effectively with Legacy Code* — characterization tests, seams, sprout and wrap.

---

## Metadata

| Field | Value |
|---|---|
| Version | 1.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-24 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | development |
| Tags | agentic-sdlc, brownfield, legacy-code, modernization, characterization-tests, expand-contract, strangler-fig, migration |
| Risk | safe |
