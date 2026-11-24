# brainstorming

Discover-stage ideation skill of the **Agentic SDLC**, used by the Analyst, the Product Manager and the UX Designer. It frames the real problem behind a request (HMW statement and indicator), generates genuinely different options with named techniques, converges with kill criteria and a desirability/feasibility/viability rubric, audits the assumptions of the chosen direction in a fresh context, runs a timeboxed UI prototype or logic spike when paper cannot settle a question, and ends with an agreed **discovery brief** that `spec-driven-development` turns into `spec.md`. It also runs standalone for names, positioning and programs.

## When to use

- The solution shape, outcome or interaction shape is still open before a spec.
- A request is a solution in disguise and the need behind it is unconfirmed.
- Several approaches exist and the trade-offs must be visible before choosing.
- A question needs a throwaway prototype to settle (UI variants or a logic spike).
- Standalone ideation: product names, taglines, positioning, programs.

Not for: grilling an existing plan (`grill-me`), writing the spec (`spec-driven-development`), issue intake and path scoring (`issue-triage`).

## What is included

- `SKILL.md` — 9-step workflow: discover context, frame, size, diverge, converge, assumption audit, prototype detour, design outline, brief and hand-off; round budget, anti-rationalization table, critical rules
- `references/techniques.md` — 15 techniques with when-to-use (HMW, JTBD, five whys, starbursting, opportunity-solution tree, SCAMPER, crazy eights, reverse brainstorm, inversion, constraint removal, analogies, simplification ladder, audience shift, build vs reuse, design it twice), session recipes, pre-mortem
- `references/refinement-criteria.md` — kill criteria K1–K7, 1–5 scoring anchors, weights and thresholds, tie-break, comparison matrix, assumption tiers, impact × confidence grid
- `references/prototyping.md` — paper vs prototype test, UI prototype vs logic spike, prototype card (timebox and kill criterion first), outcome record, what to keep
- `prompts/assumption-audit.md` — fresh-context assumption audit prompt with inline fallback
- `prompts/option-generator.md` — design-it-twice prompt for parallel constrained option passes
- `templates/brief.md` — discovery brief template with a section map to `spec.md`
- `evals/evals.json` — 6 scenarios, including the pressure scenario "skip exploration, just pick the first idea and write the spec"
- `evals/trigger-eval.json` — 31 queries (15 trigger / 16 no-trigger, aimed at `grill-me`, `spec-driven-development` and `issue-triage`)

## Typical invocation

- "Onboarding is bad — help me figure out what to do before we write a spec."
- "Should approvals be a state machine or a status field? Help me explore before deciding."
- "Compare a few approaches for real-time notifications before we spec it."
- "Brainstorm names and positioning for our contract-review tool."

## What's New in v3.1

- **Techniques catalog** — 15 named techniques with a selection table and session recipes; options are labelled by technique
- **Refinement criteria** — kill criteria written before scoring, D/F/V rubric with anchors and thresholds, tie-break by reversibility
- **Assumption audit** — fresh-context prompt with tiers (leap of faith, testable, safe); every leap of faith needs a check, a prototype or an owner
- **Prototype guidance** — UI prototype vs logic spike, prototype card with timebox and kill criterion first, keep the decision not the code
- **Discovery brief template** — PM brief fields, candidate outcomes, risk signals for re-scoring, agreement record, map to `spec.md`
- **Round budget** — at most 3 question rounds in Discover (SDLC mode), one question per message with the rest stated as proposals; `NEEDS_CONTEXT` when the outcome stays undefined
- **Hand-off** — to `issue-triage` when no intake record exists, to `spec-driven-development` on Standard/Full, acceptance test in the issue on Quick
- Legacy stage codes and capitalised artifact names removed

## What's New in v3.0

- Agentic SDLC integration: Discover-stage ideation step handing off to `spec-driven-development`
- Divergent → convergent phases; problem-first "How might we…" statement and success indicator
- Prototype detour on its own branch; design brief with a Not doing list

## What's New in v2.0

- Progress tracking, evals and a standardized description

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| SP-08 | Superpowers — `brainstorming` (MIT) | First-message contract: playback, findings, then one question | Step 1 framing message with labelled `Proposed:` guesses so one round covers who, why, success and constraint |
| SP-09 | Superpowers — `brainstorming` (MIT) | Question discipline: ask only what changes what gets built; one at a time | One question per message; repository answers first; fits the 3-round Discover budget |
| SP-10 | Superpowers — `brainstorming` (MIT) | Approaches in a message of their own, with a recommendation | Step 4 decision round: recommendation first, matrix, one question |
| SP-12 | Superpowers — `brainstorming` (MIT) | Size the work: short vs full design, split independent projects | Step 2 size table (short brief, full brief, split) |
| SP-14 | Superpowers — `brainstorming` (MIT) | Hard gate: nothing built before design approval | Hard gate on explicit brief agreement; spec.md also waits; not a sign-off |
| SP-15 | Superpowers — `brainstorming` (MIT) | Spike detour; keeping spike output is a new request | Step 6 detour; keeping prototype code re-enters `issue-triage` |
| AO-06 | Addy Osmani — `interview-me` (MIT) | Hypothesis with a confidence number before questions | `HYPOTHESIS · CONFIDENCE` line in the framing message |
| AO-13 | Addy Osmani — `idea-refine` (MIT) | Divergent/convergent loop, HMW, 5–8 variations with lenses | Steps 1, 3, 4 with technique labels and codebase prior art |
| AO-14 | Addy Osmani — `idea-refine` (MIT) | One-pager with assumptions and a Not doing list | `templates/brief.md` extended with indicator, risk signals, agreement and spec mapping |
| AO-15 | Addy Osmani — `idea-refine` frameworks (MIT) | Framework library (SCAMPER, HMW, first principles…) | `references/techniques.md`: 15 techniques with selection table and recipes, original wording |
| AO-16 | Addy Osmani — `idea-refine` refinement criteria (MIT) | Value/feasibility/differentiation rubric, assumption tiers, 2x2 | D/F/V anchors with weights, thresholds and tie-break; tiers and impact × confidence grid |
| MP-27 | Matt Pocock — `prototype` (MIT) | Prototype branch selection: logic vs UI | Branch table in `references/prototyping.md` with a default by surrounding code |
| MP-28 / MP-29 | Matt Pocock — `prototype` LOGIC/UI (MIT) | Pure liftable logic module; structurally different UI variants behind a switch | Logic spike with scenario harness; 3 variants covering the six UX states |
| MP-30 | Matt Pocock — `prototype` (MIT) | Keep the decision, prototype stays on a throwaway branch with a pointer | Outcome record in the brief; snippet kept only when it encodes a decision |
| MP-46 | Matt Pocock — design it twice (MIT) | Parallel constrained subagents produce different designs | `prompts/option-generator.md` with a sequential fallback |
| BM-64 | BMad Method — prototype plan (MIT) | Decide the kill criterion before building; timebox; keep/throw/drop | Prototype card shown before any code; session kill criteria written before scoring |
| BM-74 | BMad Method — brainstorming facilitation (MIT) | Facilitator vs generator stances; converge is a separate phase | Stance chosen in Step 0; no scoring during Step 3 |

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 3.1.0 |
| Author | Eric Andrade |
| Created | 2026-02-20 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | planning |
| Tags | agentic-sdlc, brainstorming, discovery, ideation, prototyping, design, pre-implementation |
| Risk | safe |
