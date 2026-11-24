# retrospective

This skill closes each delivery cycle by turning evidence into owned changes. It drafts a retro record in which every fact has a source. It checks whether earlier retro actions (`RA-`) and open postmortem actions (`PA-`) really landed. It reads the indicator against its baseline and drafts an outcome decision with fail-safes. At the close of an epic, it builds a view across all of its items. Each lesson becomes an action that changes a named file the next cycle reads: mechanical lessons become automated checks, and judgment lessons become lines in the AGENTS.md block. When a cause tag recurs within 90 days, an automated control is required. It is part of the Agentic SDLC Operate stage. The Scrum Master agent (played by the router) drafts the record, the SRE supplies production facts, the Product Manager gives the indicator verdict, and a named human runs the meeting and commits the record.

## When to use

- A retro is due or overdue: within 5 business days after a release reaches 100% (or after a merge with no release), or when a Quick batch reaches 10 merged items or 14 days.
- Retro facts, an agenda or the prior-action follow-through must be drafted.
- An indicator reading must be judged against its baseline and target, and an outcome decision recorded.
- The last item of an epic closes and a cross-item view is needed.
- A repeated agent mistake must become an automated check or an AGENTS.md pitfall line.

Not for: incident response and postmortems (`operations-and-incidents`), writing the pitfall line itself (`project-context`), triaging the resulting issues (`issue-triage`), release handover (`shipping-and-handover`), or reviewing a diff (`multi-axis-code-review`).

## What is included

| File | Purpose |
|---|---|
| `SKILL.md` | Workflow: discovery, due date and timebox, evidence, outcome decision, Full additions and epic view, trend check, drafting, the meeting, action shaping, validation and routing |
| `references/evidence-gathering.md` | Commands and sources for each fact, prior-action checks, Quick batch counter, cycle signals mapped to cause tags, trend inputs |
| `references/outcome-decision.md` | Comparability checks, verdict vocabulary, machine completion verdict, decision vocabulary, fail-safes, recording format, examples |
| `references/epic-aggregate.md` | Per-spec table across an epic, seam checks (duplication, pattern divergence, architecture delta, spec reconciliation, size growth), recording as `Epic <name>:` rows |
| `references/action-rules.md` | Five fields, mechanical/judgment/process classification, pitfall admission test, prove-the-check-bites, recurrence lookup and rule, closing and escalation, feeding other skills |
| `references/facilitation.md` | Agendas for 15 and 45 minutes, blameless rewrites, decision recording, solo teams and missing roles |
| `prompts/facts-drafter.md` | Fresh-context subagent prompt that drafts Prior actions, Facts, indicator and candidate Change items, with an inline fallback |
| `evals/evals.json` | 6 behaviour scenarios, including a pressure scenario |
| `evals/trigger-eval.json` | 20 trigger queries (11 positive, 9 negative) |

Stage contract: `../agentic-sdlc/references/retrospective.md`. Record template: `../agentic-sdlc/templates/retro.md`. Complete record: `../agentic-sdlc/examples/worked-example/specs/001-csv-export/retro.md`.

## Typical invocation

```text
/claude-superskills:retrospective Prepare the retro for specs/009-bulk-invite; v3.8.0 reached 100% on 2026-12-14.
```

```text
The Quick batch has 10 merged items since the last batch retro. Draft the facts and agenda.
```

```text
The multi-currency epic just closed with spec 023. Build the epic view for its retro.
```

The agent drafts the record and the agenda, then ends its turn. The human facilitator runs the meeting, the owners accept their actions aloud, and the human commits `docs/retros/YYYY-MM-DD.md`.

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| BM-84 | BMad Method (MIT) | Retrospective evidence inventory; missing evidence is recorded, never guessed | Every fact has a source or reads `n/a — <reason>`. Checked-zero and never-checked are kept apart |
| BM-85 | BMad Method (MIT) | Aggregate views across a multi-session change: architecture delta, duplication, size growth, pattern divergence, spec reconciliation | Epic view in `references/epic-aggregate.md`: one row per spec plus seam checks, recorded as `Epic <name>:` Facts rows |
| BM-86 | BMad Method (MIT) | Two dispositions per finding (this instance, and prevention of the next); previous-retro follow-through with a source | Prior actions are verified by the `Refs: RA-…` trailer, a merged commit and a changed target file. A Change item leads to an action that changes a file |
| BM-87 | BMad Method (MIT) | Acceptance verdict with fail-safes: unfinished work forces rejection, never silently accepted | Machine verdict plus a Product Owner decision (`accepted`, `accepted with follow-ups`, `hold`, `not accepted`) with five ordered fail-safes |
| BM-80, BM-81 | BMad Method (MIT) | Verified instructions block with admission rules; prefer a check over a line | Pitfall admission test. An existing pitfall line followed by recurrence means a check is needed |
| MP-74 | Matt Pocock skills (MIT) | Retro produces environment improvements in categories | Mechanical, judgment and process classification, each with its kinds of target file |
| MP-75 | Matt Pocock skills (MIT) | Mechanical lesson → deterministic check; judgment lesson → written standard | Mechanical → test, lint, CI or `sdlc-dod` command. Judgment → AGENTS.md Pitfalls line through `project-context` |
| MP-79 | Matt Pocock skills (MIT) | Prove the rule bites: pass → fail → pass | Required before a mechanical action closes, with both runs in the closing PR's §Verification |
| MP-82 | Matt Pocock skills (MIT) | Memory records history, not the present | Facts are dated and anchored to a SHA. Pitfall lines carry the retro date and action ID |
| MP-19 | Matt Pocock skills (MIT) | Facts are the agent's job; decisions are the human's | The agent drafts facts and a machine verdict and then ends its turn. People decide, own and commit |
| MP-16 | Matt Pocock skills (MIT) | Pruning: one meaning in one place, no-op instructions | No duplicate pitfall lines. A recurring lesson replaces prose with a check |
| SP-73 | Superpowers (MIT) | Evidence-cited diagnosis: no citation, no finding | Each Change item cites an artifact (finding, ledger row, commit, approval row) |
| SP-48 | Superpowers (MIT) | Rulings and deferred items surfaced to the human | Ledger rulings, waivers and `CANNOT_VERIFY` rows become cycle signals, and unreached topics go to §Carried |
| SP-44 | Superpowers (MIT) | The controller must not pre-judge findings | The facts drafter gets paths and SHAs, never a summary, and is forbidden from judging people |
| AO-104 | Addy Osmani agent-skills (MIT) | Metric honesty: never fabricate measurements, label the source | Indicator readings are never estimated or extrapolated. Partial windows are labelled, and field and lab readings are kept apart |
| AO-23 | Addy Osmani agent-skills (MIT) | Prove the gate with a violation and a clean control | The same proof of a new check, with the mistake reproduced as a fixture |
| AI-DLC (`docs/research/methods/ai-native-methods.md` §2.3) | AWS AI-DLC (MIT-0) | Operation phase feeds production feedback back into the next cycle | Outcome `not accepted` or a regression opens a `from-production` issue for Discover. Open actions are router state 9 |

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
| Tags | agentic-sdlc, retrospective, operate, continuous-improvement, metrics, outcome-decision, agents-md |
| Risk | safe |
