# agentic-sdlc

Router for the **Agentic SDLC**: a method that follows the standard software development life cycle with AI agents. **7 stages, 4 human sign-offs, 8 agents named by function, 3 paths sized by risk**, one rule — every requirement is proven.

| Stage | Lead agent (helpers) | Human sign-off |
|---|---|---|
| **Discover** | Planner | — (intake decision when a duplicate or prior rejection is found) |
| **Specify** | Planner (Security Auditor) | **Specify sign-off** — Product Owner |
| **Design** | Planner (Architect) | **Design sign-off** — Tech Lead |
| **Build** | Implementer | — (bounded loops: 3 red-green attempts, 5 rounds per task) |
| **Test** | Reviewer (Test Engineer, Security Auditor) | **Test sign-off** — human reviewer (engineer) |
| **Release** | Release Engineer | **Release sign-off** — Release Owner |
| **Operate** | SRE | On-call engineer owns incidents |

Operate feeds incidents, alert trends, indicator misses and retro actions back into Discover. Acceptance-criterion IDs (`AC-n`) trace `spec.md` → plan task → commit trailer → test → fingerprint-bound evidence → PR → release notes → production record.

## Install and first run

1. Install: `npx claude-superskills` (all 8 platforms) or `/plugin install claude-superskills@claude-superskills` in Claude Code.
2. In the project, ask: "Set up the Agentic SDLC here." `project-context` writes the AGENTS.md block with the `sdlc-dod` Definition of Done.
3. Ask: "Fix this bug with the Agentic SDLC: <issue>." Follow `references/quickstart.md` (one Quick-path bug fix, end to end).

## Paths

| Path | Score | Sign-offs |
|---|---|---|
| Quick | S ≤ 4 and R = 0 | Test (+ Release when production deploys) |
| Standard | S 5–6 or R = 1 | Specify + Design (one combined review when ≤ 5 tasks), Test, Release |
| Full | S ≥ 7, R ≥ 2, personal/health data or irreversible | All four separately + a second human reviewer |

S = files + components + iterations (each scored 1–3); R = number of risk triggers (auth, personal/health data, money, public API, schema/migration, irreversible, regulated). The path is the higher of the two routes.

## What is included

- `SKILL.md` — router: state detection (Step 0), path scoring, stage dispatch, approvals, loop bounds, progress display and the Module Index (every module and when to load it).
- `references/lifecycle.md` — stages with entry/exit conditions, the four sign-offs, paths, ID chain, loop bounds, release and operate rules that start in Specify.
- `references/rules.md` — 12 non-negotiable rules with checks and failure behaviour, status vocabulary, change protocol, red-flag table.
- `references/artifacts.md` — artifact index: project layout, template per artifact, required paths, validators, AGENTS.md block with `sdlc-dod`.
- `references/phase-boundaries.md` — hand-off triggers, context hygiene per agent, resume procedure, `handoff.md` format.
- `references/agents.md` + `agents/*.md` — the eight agent briefs: reads, never sees, skills, may do, never, tools, returns, status.
- `scripts/lib/` — shared Markdown, git and CLI helpers for the method's checks (Node ≥ 18, no dependencies); `scripts/test/` — `node --test` suite.
- `examples/worked-example/` — the CSV-export Standard-path example used as test fixtures.
- `evals/` — behaviour scenarios and trigger queries.

Run the tests from the repository root:

```bash
node --test skills/agentic-sdlc/scripts/test/*.test.mjs
```

## Typical invocation

- "Build the CSV export with the Agentic SDLC."
- "Where are we on the payments refactor? What's next?"
- "Requirements changed after Specify sign-off — handle it."
- "An incident in production created new work — bring it into the cycle."

## Related approaches

The Agentic SDLC keeps the strongest idea of the classic V-model — every definition has a matching proof — as an explicit traceability rule inside a continuous delivery cycle. Other frameworks for AI-assisted engineering exist, including V-model-based ones such as **Agile V™** by Christopher Koch (CC BY-SA 4.0). No Agile V text, templates or structures are used here; where a concept also appears in Agile V, it is expressed in original wording. See `THIRD_PARTY_NOTICES.md`.

## Influences

| Source (license) | Adapted here |
|---|---|
| **Superpowers** (MIT) | Hard gates before code, anti-rationalization tables, fresh subagent per task, implementer status contract, bounded fix loop |
| **Matt Pocock — skills** (MIT) | Phase boundaries, handoff file, context hygiene |
| **Addy Osmani — agent-skills** (MIT) | Lifecycle entry points, verification before completion, incremental implementation |
| **BMad Method** (MIT) | Risk-scaled paths, change impact analysis, parallel review lenses with verify-then-verdict |

All text is original; mechanism IDs and precedents are listed in `docs/research/gap-closure/architect-report.md`.

## What's New in 2.0.0

- Rewritten in the D10 vocabulary: 7 stages, 4 sign-offs, 8 agents, 3 paths. Stage codes and numbered checkpoints are gone.
- Scored path rubric (size + risk), approval hashes that void on edit, fingerprint-bound evidence, explicit loop bounds.
- Eight agent files with tool allow lists and authority limits; Module Index with the off-first-path rule.
- Shared script libraries and test harness; worked-example skeleton.

## Metadata

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-19 |
| Updated | 2026-11-22 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | orchestration |
| Tags | agentic-sdlc, sdlc, spec-driven, ai-agents, human-in-the-loop, traceability, workflow, router |
| Risk | safe |
