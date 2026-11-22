# Phase Boundaries — Context Hand-off and Resume

Load this file at every stage end, when the platform reports high context use, and when work changes tool, machine or person. It decides what the next stage carries forward and how interrupted work resumes. Stages hand off through **files**, never through chat summaries: the next stage reads `spec.md`, `plan.md`, the PR body and the ledgers directly.

## Triggers

| Trigger | Detection | Action |
|---|---|---|
| Stage end | An exit record from `references/lifecycle.md` §1 is written (approval requested, PR opened, release noted) | Apply the decision order below |
| Context pressure | The platform reports ≥ 70% of the context window used, or ≥ 2 Build tasks were completed in the same context | Finish the current green test run, update the ledger, then hand off or compact |
| Change of hands | Switching tool, machine, directory or person | Hand off (write `handoff.md`) |
| Interruption | Session ended, crash or compaction mid-task | Resume procedure below |

## The five options

| Option | Effect | Use when |
|---|---|---|
| **Continue** | Stay in the current context | The next stage depends on reasoning not yet written to an artifact |
| **Delegate** | Dispatch a fresh agent with a brief (`agents/*.md`) and receive its report | The unit of work is self-contained: one plan task, one review lens, acceptance-test design |
| **Clear** | Start an empty context and resume from artifacts | Every decision that matters is already in `spec.md`, `plan.md`, the PR or the ledgers |
| **Hand off** | Write `specs/NNN-slug/handoff.md`, then start fresh from it | Work moves to another tool, machine, directory or person |
| **Compact** | Summarize and continue | The work must continue in one thread and none of the above applies |

## Decision order

1. Reasoning exists only in this conversation → write it into the proper artifact (spec Revision log, ADR, plan task, loop ledger) **first**, then go to step 2. Continue only when the next stage is the same agent within the same stage group (Plan → Specify → Design for the Planner).
2. Next unit self-contained → **Delegate**.
3. Everything in artifacts → **Clear**.
4. Moving to another tool, machine or person → **Hand off**.
5. Otherwise → **Compact** at the nearest boundary.

Failure behaviour: a decision found in chat but not in an artifact after a Clear → treat it as not made; ask the human again and record it.

## Default per transition

| Transition | Default | Reason |
|---|---|---|
| Plan → Specify → Design | Continue (Planner) | One line of reasoning from intent to plan; written to `spec.md` and `plan.md` as it goes |
| Design → Build | Clear; delegate each task | `plan.md` task rows are self-contained by design |
| Build task → Build task | Delegate (fresh Implementer per task) | Fresh context per task prevents drift |
| Plan approval → acceptance tests | Delegate to the Test Engineer | The test designer never sees the implementation diff |
| Build → Test | Delegate each review lens (Reviewer) | Reviewers start without the author's reasoning |
| Test → Release | Continue (Release Engineer reads the approved PR) | Release uses the evidence and approval just produced |
| Release → Operate | Continue through the first indicator reading (≤ 7 days), then clear | Later incidents start from `ops.md` and the runbook |
| Operate → next Plan | Clear after the retro record is written | Learnings live in AGENTS.md, checklists and new issues, not in chat |

## Context hygiene by agent (what each agent never sees)

| Agent | Receives | Never receives |
|---|---|---|
| Planner | Request, AGENTS.md block, code map, prior specs | — |
| Architect | Approved spec, ADRs, code map, relevant code | Implementer chat history |
| Implementer | One plan task row, the files it lists, the spec ACs it serves, the DoD block | Other tasks' reasoning; review findings of other tasks |
| Test Engineer | Approved spec, code at the base commit, test conventions | The implementation diff, the branch, the PR text |
| Reviewer lenses L1–L3 | Diff, spec, plan, evidence ledger | The Implementer's reasoning; the PR prose as evidence |
| Reviewer lens L4 | The diff only | Spec, plan, PR text |
| Security Auditor | Spec, threat model, diff (Test stage) | Secrets, production data |
| Release Engineer | Approved PR, spec rollback and observability, CI config | Production credentials before Release approval |
| SRE | Ops record, runbook, alerts, spec indicator | Credentials beyond the on-call engineer's grant |

## Resume procedure

Trigger: a new session on a repository with open work, or a compaction mid-task.

1. Run Step 0 of the router (`status.mjs` or the manual state table).
2. Unattended run in progress (`.agentic-sdlc/runs/<id>/ledger.jsonl` exists, no `result.json`) → run `preflight`, then continue from the first task whose state is not `done` (`references/autonomous.md`).
3. Otherwise read `specs/NNN-slug/handoff.md` if present; compare its `Last commit` with `git rev-parse HEAD`.
4. Confirm the resume point with the human in one line: `Spec rev 2 approved, plan approved, T1–T5 committed. Resume Build at T6?`

Failure behaviour: `handoff.md` older than HEAD (commits after it) → ignore its "In progress" field and derive state from the ledgers and git log. Ledger unparsable → `NEEDS_CONTEXT`, recommend `project-context audit`, exit 2 from the status script.

## Handoff file — `specs/NNN-slug/handoff.md`

```markdown
# Handoff — NNN-slug — YYYY-MM-DD HH:MM

**Stage:** Plan | Specify | Design | Build | Test | Release | Operate · **Path:** Quick | Standard | Full
**Last commit:** <sha> · **Fingerprint:** <12 hex>
**Artifacts:** spec.md rev N (hash) · plan.md rev N (hash) · PR #<n>
**Done:** T1–T5 (evidence in ledger)
**In progress:** T6 — round 2 of 5 — last command `<cmd>` exit 1 — failure signature `<test> :: <error line>`
**Next step:** <one concrete action>
**Decisions not yet in artifacts:** none (move every decision into the spec, plan or an ADR before writing this file)
**Open questions for the human:** <list, or none>
```

The handoff file is a pointer, not the record. Overwrite it at each hand-off; git history keeps earlier versions.

## Source

Adapted from Matt Pocock's skills (MIT) phase-boundary and handoff practices and Superpowers' (MIT) fresh-subagent-per-task pattern; text is original.
