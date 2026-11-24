# issue-triage

Discover-stage skill of the **Agentic SDLC**. Takes one incoming item — a tracker issue, an ad-hoc request, a `from-production` issue from the SRE or a retro action — and turns it into a decision-ready intake record: a concept-based search of open and closed issues, `docs/out-of-scope/`, `specs/` and the code for duplicates, prior rejections and existing behaviour; the Product Owner's intake decision when a match is found; classification as bug, task, story or epic (epics split first); the path score line from the `paths.md` rubric (S 3–9, R 0–7, higher route wins); readiness criteria per path; and, when information is missing, a needs-info reply that keeps what is already established. Rejected ideas are recorded once per concept with a durable reason and a revisit trigger.

## When to use

- A new issue or chat request needs intake before any spec or code.
- A `from-production` issue (postmortem action, alert trend, indicator miss) must be triaged within 2 business days.
- A retro action `RA-YYYYMMDD-n` becomes the next work item.
- A backlog of untriaged or `needs-info` items needs a pass.
- "Was this requested or rejected before?", "Bug or feature?", "Which path?"

Not for shaping a vague idea (`brainstorming`), writing the spec (`spec-driven-development`), root-causing a bug (`systematic-debugging`), running incidents (`operations-and-incidents`), holding a retro (`retrospective`) or repository setup (`project-context`).

## What is included

- `SKILL.md` — workflow: Step 0 intake setup discovery, take-in, duplicate and prior-rejection search, Product Owner intake decision, classification, path score, PM brief and indicator, readiness, intake record and hand-off, out-of-scope records, batch mode; anti-rationalization table; critical rules; five examples
- `references/duplicate-search.md` — term building by domain concept, eight sources, `gh` / `glab` / Jira / Azure Boards / local commands, hit ratings, the `Search:` line, recurrence check
- `references/classification.md` — bug / task (spike) / story / epic decision procedure, tie-breakers, class duties, epic split via the capability map, Operate and retro inputs, worked examples
- `references/readiness.md` — triage states, criteria G1–G8 for every path plus Quick, Standard and Full criteria, spec-header mapping, needs-info rules
- `references/templates.md` — intake record, intake decision request and record, needs-info reply, duplicate and already-implemented replies, out-of-scope record, local issue file
- `prompts/triage-pass.md` — fresh-context Analyst prompt, batch and search-only variants, inline fallback
- `evals/evals.json` — 5 scenarios (prior rejection, pressure to skip scoring, vague bug, production intake, epic split)
- `evals/trigger-eval.json` — 16 trigger queries (9 positive, 7 negative)
- Uses from `agentic-sdlc`: `references/paths.md`, `references/lifecycle.md`, `references/governance.md`, `references/retrospective.md`, `references/release-ops.md`, `agents/analyst.md`, `agents/product-manager.md`, `templates/spec.md` (header `Intake`, checked by `spec-lint` H07)

## Typical invocation

- "Triage issue #412."
- "Has anyone asked for bulk invoice download before?"
- "Take the from-production issue for the export indicator into Discover."
- "Go through the untriaged backlog, oldest first."
- "We won't do offline mode — record it so nobody re-proposes it."

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| MP-33 | Matt Pocock — skills (MIT) | Triage state machine, attention view, AI-generated disclaimer on tracker posts, resume without re-asking | Seven states ending in the method's hand-offs (Build on Quick, Specify on Standard/Full); batch order puts `from-production` first because of the 2-business-day bound |
| MP-34 | Matt Pocock — skills (MIT) | Redundancy and prior-rejection checks by domain concept; "report where you looked"; verify the claim | ≥ 3 terms × ≥ 4 sources with a mandatory `Search:` line; read-only bug verification statuses; ambiguity resolves toward the rating that needs a decision |
| MP-36 | Matt Pocock — skills (MIT) | Needs-info split between established facts and remaining questions | ≤ 5 questions naming who answers, reminder at 14 days, closing proposal at 28; never used to park production items |
| MP-37 | Matt Pocock — skills (MIT) | Out-of-scope knowledge base, one file per concept, never for already-implemented behaviour | `docs/out-of-scope/<slug>.md` with the Product Owner's exact words and an observable revisit trigger |
| MP-09 | Matt Pocock — skills (MIT) | Tracker indirection, comment-then-close, fork target check | Commands for `gh`, `glab`, Jira, Azure Boards and a local `docs/issues/` fallback |
| MP-19 | Matt Pocock — skills (MIT) | Facts are the agent's job; decisions are the human's | "Look up before asking" in readiness; duplicate, rejection and priority calls stay with the Product Owner |
| MP-10 | Matt Pocock — skills (MIT) | Read the glossary first; proceed silently when it is absent | Glossary terms seed the search; missing knowledge files are never flagged as errors |
| BM-04 | BMad Method (MIT) | Size and stakes as separate axes; intake by container (standalone, epic, initiative) | Class kept independent of the path; the path comes only from the S/R rubric |
| BM-10 | BMad Method (MIT) | Single-goal scope standard (count shippable goals, not verbs) | First question of the classification procedure: ≥ 2 shippable goals → epic |
| BM-55, BM-56 | BMad Method (MIT) | Epic slicing by deployable capability; tracer bullet first; split, never shrink | Epic split before scoring, reusing the `spec-driven-development` capability map; one child item per slice |
| BM-13 | BMad Method (MIT) | Ready-for-development standard | Readiness criteria per path (G1–G8, Q, S, F) mapped to the spec header fields |
| BM-70 | BMad Method (MIT) | Invent no regulation, citation or threshold | Regulations must be named by a human (F3); unknown numbers are `n/a — <how to measure>` |
| AO-09 | Addy Osmani — agent-skills (MIT) | Intent restate with a mandatory out-of-scope line | Problem with evidence plus PM-brief non-goals feed `## Problem` and `## Non-goals` |
| SP-12 | Superpowers (MIT) | Size the work; step up a size when it grows | Unknown inputs default to Standard and are re-scored upward only |

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-24 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | planning |
| Tags | agentic-sdlc, triage, intake, issues, backlog, discover |
| Risk | safe |
