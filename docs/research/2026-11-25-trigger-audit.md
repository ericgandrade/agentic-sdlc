# Trigger-Collision Audit — 33 Repository Skills plus Built-ins

**Date:** 2026-11-25 · **Plan task:** E.1 of `docs/plans/2026-11-20-agentic-sdlc-execution-plan.md` · **Scope:** every `skills/*/SKILL.md` description and `evals/trigger-eval.json`, plus the built-in Claude Code skills `code-review`, `security-review` and `simplify`.

## Purpose

A skill is chosen from its one-line `description:`. When two descriptions both plausibly claim the same request, the agent picks one at random, or the wrong one, and the method breaks at that seam. The 20 Agentic SDLC skills split one workflow into adjacent stages, so their descriptions share vocabulary (spec, plan, test, evidence, rollback, release, incident, AGENTS.md). This audit finds those overlaps, separates intended hand-offs from real collisions, and fixes the real ones with explicit "Not for X (use Y)" boundaries.

## Method

1. Read the `description:` line of all 33 `SKILL.md` files and every `evals/trigger-eval.json` (32 files; `document-converter` has none). Schemas differ: `prompt-engineer` uses a bare array of `{query, should_trigger}`; the others use `{skill_name, description, queries: [{id, query, should_trigger}]}`.
2. For each should-trigger query, judged which other descriptions would also plausibly claim it, and recorded each overlapping pair with example queries.
3. Classified each pair: **(a)** intended hand-off (router → stage skill, or producer → consumer) that the descriptions state or can state; **(b)** real collision — both descriptions claim the same intent with no boundary; **(c)** an eval query whose label conflicts with another skill's eval.
4. Checked every description for a clear "use when" and, where a collision exists, a "Not for X (use Y)" boundary.
5. Fixed (b) by editing only the `description:` line (one line, starts "This skill should be used when", no extra fields, under 1,024 characters) and, where a boundary had no eval coverage, appended should-not-trigger queries in the file's existing schema. Two eval files whose `description` field was a verbatim copy of the SKILL.md description (`executing-plans`, `test-strategy`) were re-synced.
6. Validated: `./scripts/validate-skill-yaml.sh skills/<s>` passes with no warning for all 22 edited skills; every edited `trigger-eval.json` parses with `JSON.parse`; no description contains a YAML plain-scalar hazard (`: `, ` #`, or a leading indicator character); the longest edited description is 842 characters.

Built-ins are described from general knowledge: **code-review** reviews a PR or diff for bugs and quality; **security-review** audits pending changes for vulnerabilities; **simplify** reviews changed code for reuse and quality and applies the fixes.

## Collision matrix

Verdict key: (a) intended hand-off · (b) real collision · (c) conflicting eval label · — no collision.

| # | Pair | Overlapping query example | Verdict | Action |
|---|---|---|---|---|
| 1 | agentic-sdlc ↔ every stage skill | "Run the Test stage and ask for Test sign-off" | (b) router had no boundary | Router "not for one stage task asked on its own" |
| 2 | agentic-sdlc ↔ spec-driven-development | "Product changed the requirement after approval" | (a) router picks re-entry, SDD writes delta | Both reworded |
| 3 | agentic-sdlc ↔ agent-skill-orchestrator | "Which skill should I use next?" | (b) | Boundaries + negatives on both |
| 4 | brainstorming ↔ grill-me | "stress-test", "pre-mortem" | — grill-me needs the word "grill" | None |
| 5 | brainstorming ↔ spec-driven-development | "Convert this brainstorming brief into requirements" | (a) brief feeds spec | Boundaries |
| 6 | brainstorming ↔ senior-solution-architect | "Compare a few approaches for notifications" vs "two or three different designs for the notification module" | (b) | Pre-spec → brainstorming; approved spec → architect; negatives |
| 7 | brainstorming ↔ issue-triage | "framing the problem behind a request" vs "a new request needs intake" | (b) | Boundaries on both |
| 8 | writing-plans ↔ executing-plans | "Execute this plan" vs "Write a plan" | — negatives already on both | Boundary made explicit |
| 9 | writing-plans ↔ codebase-modernization | "migration plan for moving to AWS" vs "Plan a strangler fig migration" | (b) | Modernization hands slices to writing-plans; negative |
| 10 | writing-plans ↔ senior-solution-architect | "Design a detailed plan for our microservices migration" | (b) | Boundaries |
| 11 | writing-plans ↔ agent-skill-orchestrator | "Create a strategic execution plan" | (b) | Boundaries + negatives |
| 12 | writing-plans ↔ spec-driven-development | "Create a written spec and plan for multi-tenancy" | (c) compound query | Accepted, flagged |
| 13 | executing-plans ↔ test-driven-development | "Implement task T4 test-first" | (b) | One task → TDD; whole plan → executing-plans |
| 14 | test-driven-development ↔ codebase-modernization | Near-identical characterization-test positives in both evals | (b)+(c) | In-task → TDD; for a migration → modernization; negative |
| 15 | test-driven-development ↔ systematic-debugging | "Fix bug 418 with a regression test first" | (b) | Known cause → TDD; unproven → debugging |
| 16 | test-driven-development ↔ test-strategy | "Would my tests catch a bug here?" | (b) | Unit in-task vs spec-derived acceptance; negative |
| 17 | test-strategy ↔ verification-gate | "Run acceptance tests at PR head and record the evidence" | (b) | PR Verification table → gate |
| 18 | verification-gate ↔ multi-axis-code-review | "evidence supports a GO" vs "GO or NO-GO" | (b) | Evidence verdict vs review verdict |
| 19 | verification-gate ↔ deployment-pipeline ↔ project-context | gate said sdlc-dod "must be enforced" | (b) wording | Write / run / wire into CI split; negative |
| 20 | multi-axis-code-review ↔ security-hardening | "Run the security lens L3 on this PR" | (b) | L3 owned by security-hardening; negative |
| 21 | multi-axis-code-review ↔ built-in code-review | "Review this pull request for bugs" | (b) | No spec or plan → built-in |
| 22 | security-hardening ↔ built-in security-review | "Check my changes for vulnerabilities" | (b) | No spec → built-in |
| 23 | multi-axis-code-review ↔ built-in simplify | design and simplicity lens | (a) review reports, simplify edits | Accepted |
| 24 | deployment-pipeline ↔ operations-and-incidents | "advance, hold or roll back?" in both evals | (b) | Ops reads; pipeline decides; negative |
| 25 | deployment-pipeline ↔ shipping-and-handover | release notes, rollback, Release stage | (b) | Boundaries |
| 26 | shipping-and-handover ↔ verification-gate | "open the PR with the evidence" | (b) | Evidence → gate |
| 27 | shipping-and-handover ↔ operations-and-incidents | "hand it over to the SRE" | (a) | Boundary |
| 28 | systematic-debugging ↔ operations-and-incidents | "from-production issue landed in Build" | (b) | Root cause vs incident |
| 29 | retrospective ↔ operations-and-incidents | postmortem; "7-day indicator reading" vs "compare the reading with the baseline" | (b) | Ops measures; retro judges; negative |
| 30 | retrospective ↔ project-context | "the agent ran pytest outside the virtualenv again" | (b) | Single mistake vs recurring; negative |
| 31 | issue-triage ↔ operations-and-incidents | from-production issues | (a) ops opens, triage takes in | Boundary |
| 32 | issue-triage ↔ retrospective | "Pick up retro action RA-… as next work item" | (a) | Accepted |
| 33 | project-context ↔ codebase-modernization | "map the code" vs "map the dependencies before we split the monolith" | (b) | Boundaries |
| 34 | project-context ↔ deployment-pipeline | "CI enforcement inputs" vs "Configure branch protection" | (b) | Boundary |
| 35 | senior-solution-architect ↔ codebase-modernization | "which parts should we re-platform first?" | (b) | Boundaries |
| 36 | senior-solution-architect ↔ systematic-debugging | "rule on whether the design is wrong" | (a) escalation | Boundary |
| 37 | spec-driven-development ↔ security-hardening | spec Security notes | (a) threat model feeds spec | Boundary |
| 38 | deep-research ↔ senior-solution-architect | "What technology choices should we make?" | (b) | Boundary |
| 39 | deep-research ↔ codebase-modernization | "Research how invoice rounding works … cite file and line" | (b) | Boundary + negative |
| 40 | deep-research ↔ us-program-research | "Research and rank the top PhD programs" | (b) + truncated description | Description repaired; negative |
| 41 | prompt-engineer ↔ skill-creator ↔ project-context | "improve this prompt" / "optimize a skill's description" / "clean up CLAUDE.md" | (a) noun decides | Accepted |
| 42 | skill-creator ↔ stage skills | "Develop a skill for postmortem writing" | (a) | Accepted |
| 43 | executing-plans ↔ deployment-pipeline | "Follow this 7-step deployment plan" | (a) | Accepted |
| 44 | agent-skill-discovery ↔ orchestrator, agentic-sdlc | "What skills can I use here?" | (a) | Orchestrator boundary |

## Description edits

Every edit keeps the original trigger list and appends a "Not for X (use Y)" boundary naming the neighbours from the matrix. Wording changes beyond that:

| Skill | Before → after |
|---|---|
| agentic-sdlc | "handling a requirement change after Specify sign-off" → "…(deciding where it re-enters). It hands each stage to its stage skill and is not for one stage task asked on its own" |
| codebase-modernization | "slicing the migration into plan tasks" → "…into ordered slices for writing-plans" |
| test-driven-development | + "pinning untested code with a characterization test before changing it inside a task"; "One task at a time" |
| verification-gate | "sdlc-dod … must be enforced" → "must be run against a change" |
| multi-axis-code-review | + "its security lens L3 comes from security-hardening" |
| operations-and-incidents | + "the Release Engineer asks for a rollout-stage signal reading, the first indicator reading is due"; boundary "not for owning the rollout decision, deploy log or rollback" |
| retrospective | "a repeated agent mistake" → "an agent mistake that recurs across cycles" |
| project-context | "record an agent mistake" → "record an agent mistake as an AGENTS.md pitfall" |
| us-program-research | truncated "…US academic programs (PhD, Master" → full description (PhD, master and bachelor programs incl. MBA and law; credential gap, funding fit, application plan) |

Boundary-only edits: brainstorming, spec-driven-development, issue-triage, senior-solution-architect, writing-plans, executing-plans, test-strategy, security-hardening, deployment-pipeline, shipping-and-handover, systematic-debugging, deep-research, agent-skill-orchestrator. Total: 22 descriptions edited, longest 842 characters.

**Eval additions (should-not-trigger, existing schema):** agentic-sdlc 1, brainstorming 1, senior-solution-architect 1, writing-plans 2, test-driven-development 1, test-strategy 1, verification-gate 1, operations-and-incidents 1, retrospective 1, project-context 1, multi-axis-code-review 1, deep-research 2, agent-skill-orchestrator 2 — 16 queries in 13 files. No existing label was changed.

## Accepted overlaps

- **Router hand-offs (rows 1–2).** agentic-sdlc legitimately claims "run the Test stage" or "start the Release stage" because the user asks for the stage to be driven, not for one artefact; the router then loads the stage skill. Its description now says so, and its eval already has single-stage negatives.
- **Producer → consumer seams (rows 5, 27, 31, 32, 36, 37).** One skill's output is the next skill's input (brief → spec, threat model → spec Security notes, release → Operate, postmortem actions → triage, debug bound → Architect). Both descriptions now name the other side.
- **Rollout reading (row 24, residual).** "Read the dashboards and tell me whether to advance" still fits both skills because operations-and-incidents produces the reading the Release Engineer uses. The decision, deploy log and rollback stay in deployment-pipeline; the bodies already agree.
- **Characterization tests (row 14, residual).** The TDD brownfield variant writes `CHAR-n` inside a task and codebase-modernization designs them for a migration. The two near-identical positives remain; the descriptions now split them by scope ("inside a task" vs "for a legacy migration").
- **Generic reviews (rows 21–23).** A request with no spec or plan, such as "review this PR for bugs", is left to the built-in `code-review`/`security-review`; `simplify` edits code rather than reporting, so it does not compete with the review verdict.
- **Meta and non-SDLC skills (rows 41–44).** The object noun (prompt, skill, CLAUDE.md, installed resources) separates prompt-engineer, skill-creator, project-context and agent-skill-discovery. audio-transcriber vs youtube-summarizer ("2-hour conference recording") is separated by the YouTube URL.
- **Borderline labels, not changed (c).** brainstorming + "Should the approval workflow be a state machine or a status field?" (could be design work); executing-plans + "I have a written spec — execute it step by step" (under the method a spec needs a plan first); writing-plans + "Create a written spec and plan for adding multi-tenancy" (compound). These are older generic queries; the eval owners should review whether to reword them.

## Description-format check

All 33 descriptions state when to use the skill. Thirty-one start with "This skill should be used when"; `prompt-engineer` ("Use this skill when…") and `skill-creator` ("Create new skills…. Use when…") use other forms but have clear triggers and no SDLC collision, so they were not edited. `grill-me` already had the strongest boundary in the repo. `document-converter` has no `trigger-eval.json`, so its triggers are untested.

## Conclusion

The audit found **44 pairs** worth judging: **29 real collisions** (all fixed through 22 description edits and 16 new negative queries), **13 intended hand-offs or accepted overlaps**, and **2 pairs with no collision**. Within the fixed collisions, 2 keep a documented residual overlap (rollout reading, characterization tests), and 3 older eval queries are flagged as borderline labels without relabelling. The main pattern: the stage skills described what they do but rarely what they do not, so adjacent stages (Test vs Build, Release vs Operate, Discover vs Design) claimed the same verbs. Every SDLC description now ends with a "Not for X (use Y)" clause naming its neighbours, which also gives the router a deterministic hand-off map. A live trigger run of the updated eval sets (skill-creator's description optimizer) is the recommended follow-up to measure the change.
