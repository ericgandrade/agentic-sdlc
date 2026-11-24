# grill-me

Relentless Socratic interview that walks every branch of a plan, design, spec or idea until nothing is silently assumed. **Agentic SDLC · Discover stage** (also Specify, to stress-test a spec or `ux.md` draft). Used by the Analyst, the Product Manager and the UX Designer; the Product Owner makes the intake decision. One decision per question, a recommended answer with every question, facts looked up instead of asked, and a 3-round stop rule per stage: open items after round 3 are deferred with an owner or end the stage as `NEEDS_CONTEXT`.

## When to use

- Only when the user explicitly says "grill me" / "me grille", or agrees when the `agentic-sdlc` router or an agent role proposes it.
- Not for "stress-test", "poke holes", "devil's advocate", "review" or "feedback" requests; idea exploration goes to `brainstorming`, intake to `issue-triage`, spec writing to `spec-driven-development`.

## How it works

- Maps the decision tree (fact or decision, material or deferrable, blocked by), then asks the **frontier** in rounds: one decision per question, at most four per round, weighty questions alone.
- **Facts are the agent's job** (looked up, via the `fact-lookup` subagent prompt when available); **decisions are the human's**.
- Pushes back once on weak answers with an evidence question, then records the answer as an assumption.
- Captures settled terms in `GLOSSARY.md` and ADR candidates (drafted as `Proposed` in docs mode; handed to the Architect in SDLC mode).
- Closes with a contract summary — decisions, assumptions, open questions, risks, candidate acceptance criteria, coverage — that `spec-driven-development` reads in synthesize mode.

## What is included

- `SKILL.md` — workflow Steps 0–7, anti-rationalization table, red flags, critical rules, examples
- `references/grilling-protocol.md` — decision tree, frontier, question format and quality check, weak-answer follow-ups, stop conditions, questionnaire for an absent owner, anti-sycophancy
- `references/question-bank.md` — 13 categories (problem, users, scope, data, failure modes, security, operations, cost, rollback, metrics, dependencies, vocabulary, experience) with spec-section map
- `references/capture.md` — glossary entry and ADR candidate formats, what each mode may write
- `references/closing-summary.md` — closing summary contract, status rules, mapping to `spec.md`
- `prompts/fact-lookup.md` — read-only fact-lookup subagent brief with fallback
- `evals/evals.json` — 5 scenarios, including the "just agree with me" pressure test
- `evals/trigger-eval.json` — 33 trigger queries (strict "grill" trigger; negatives aimed at brainstorming, spec-driven-development and issue-triage)

## What's New in v2.2

- **Full grilling primitive** — decision-tree tags, one decision per question, weighty questions alone, question quality check
- **Question bank** — 13 categories with look-up-first facts, recommendation patterns and material signals, mapped to `spec.md` sections
- **Glossary and ADR capture** — formats aligned with `GLOSSARY.md` and the artifact index §ADR; SDLC mode lists ADR candidates for the Architect
- **Closing summary contract** — fixed sections, status rules (`DONE` / `DONE_WITH_CONCERNS` / `NEEDS_CONTEXT` / `BLOCKED`), hand-off to `spec-driven-development`
- **Shared round budget** — 3 question rounds per stage, shared with the calling agent's questions
- **Pressure handling** — "just agree with me" stops the questions but never turns open items into decisions
- **Evals** — new `evals/evals.json`; `trigger-eval.json` converted to the id schema and extended

## What's New in v2.0

- Frontier rounds with recommended answers ("yes" accepts the recommendation)
- Docs mode: GLOSSARY.md and ADR capture
- Facts-vs-decisions rule with parallel lookups
- Candidate acceptance criteria in the closing summary; handoff to `spec-driven-development`

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| MP-18 | Matt Pocock — `grill-me` / `grilling` (MIT) | Design tree, frontier rounds, recommended answer with every question | `grilling-protocol.md` §1–3 with node tags, ≤ 4 per round and weighty questions alone |
| MP-19 | Matt Pocock — `grilling` (MIT) | Facts are looked up; decisions go to the human | Step 2 and `prompts/fact-lookup.md` with a self-lookup fallback |
| MP-20 | Matt Pocock — `grilling` (MIT) | Done when the frontier is empty and understanding is confirmed | Stop condition 1 and the playback in Step 7 |
| MP-21 | Matt Pocock — `grill-with-docs` (MIT) | Write glossary and ADRs as decisions settle | Docs mode in `capture.md`; SDLC mode lists candidates for the Architect |
| MP-22 | Matt Pocock — `domain-modeling` (MIT) | Challenge against the glossary, sharpen fuzzy words, concrete scenarios, cross-check code | `grilling-protocol.md` §7 |
| MP-23 | Matt Pocock — `domain-modeling` GLOSSARY format (MIT) | Term, definition, aliases to avoid | Entry format with example and source in `capture.md` §2 |
| MP-24 | Matt Pocock — ADR test (MIT) | Hard to reverse, surprising, real trade-off | Subordinated to the artifact index rule (expensive to reverse **or** ≥ 2 options compared); "surprising" only orders candidates |
| MP-25 | Matt Pocock — `to-questionnaire` (MIT) | Grill the send, not the subject, when the owner is absent | `grilling-protocol.md` §9 |
| MP-31 | Matt Pocock — synthesize, not interview (MIT) | Do not re-interview when answers exist | Hand-off to `spec-driven-development` synthesize mode |
| AO-06 | Addy Osmani — `interview-me` (MIT) | Hypothesis with a confidence number before questions | Recommendation on every question, worded so "yes" accepts |
| AO-07 | Addy Osmani — `interview-me` (MIT) | One question at a time with a guess | Weighty questions alone; conversation mode drops to one per round |
| AO-62 | Addy Osmani — ADR practice (MIT) | Short ADRs with options and consequences | Draft format in `capture.md` §3 |
| BM-14 | BMad Method — analyst (MIT) | Investigate before asking | Step 2: facts first, `file:line` citations |
| BM-15 | BMad Method — open-questions protocol (MIT) | Open questions carry an owner | `deferred: <owner>` / `material — NEEDS_CONTEXT` classification |
| BM-73 | BMad Method — advanced elicitation (MIT) | Cold readers pushing a draft off center | Specify-stage grilling of a spec or `ux.md` draft, section by section via the spec-section map |
| BM-75 | BMad Method — forge idea (MIT) | Pressure-test with modes and exits | Three modes (conversation, docs, SDLC), explicit stop conditions and §10 anti-sycophancy |
| SP-09 | Superpowers — `brainstorming` (MIT) | Ask only what changes what gets built | Question quality check "changes something" |
| n/a (scoring note) | GitHub Spec Kit — `/speckit-clarify` (MIT) | Up to 5 questions one at a time, recorded as Clarifications (`docs/research/scoring/scores/S-C/spec-kit.md:19`) | Closing summary sections that map onto the spec |
| n/a | Kiro — requirements clarification (no inventory ID) | Clarify before the spec is written | Specify-stage grilling of spec and `ux.md` drafts |

Credits kept: Matt Pocock's `grill-me`, `grilling`, `grill-with-docs` and `domain-modeling`; Addy Osmani's `interview-me`.

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 2.2.0 |
| Author | Eric Andrade |
| Created | 2026-05-08 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | planning |
| Tags | agentic-sdlc, planning, discover, specify, socratic, decision-tree, glossary, adr |
| Risk | safe |
