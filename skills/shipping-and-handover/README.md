# shipping-and-handover

Build-end and Release-stage skill of the **Agentic SDLC**. It turns a finished branch into something a person who did not build it can approve, operate and undo. The **Developer** uses it to close a branch: a 14-item pre-ship checklist, a docs-drift check, and a PR body with fingerprint-bound Verification rows. The Summary in that body carries the smallest useful visual, a before/after pair, the door call (one-way or two-way), the blast radius and the rollback line copied from the spec. The Developer then presents the integration options (push and open the PR, keep, merge only after a Test sign-off, discard only after a typed confirmation). The **Release Engineer** uses it to write release notes and the service runbook, to answer release checklist R1–R9 and the go/no-go criteria with evidence, to request Release sign-off and to hand the release to Operate (production links per AC, indicator and retro due dates, open items). The **Tech Writer** uses it for the docs task and the `## For users` section. Stage contracts: `skills/agentic-sdlc/references/release-ops.md`, `references/verification.md`, `templates/pr-body.md`, `templates/release-notes.md`, `agents/release-engineer.md`, `agents/tech-writer.md`.

## When to use

- Every plan task is committed and the DoD is green: run the pre-ship checklist and open the PR.
- A branch is finished or abandoned and the next step is merge, PR, keep or discard.
- The Test sign-off is recorded and the branch must be merged and cleaned up safely.
- A merged PR goes to production: release notes, runbook, R1–R9, go/no-go, Release sign-off request.
- A diff changes an endpoint, CLI flag, configuration key, schema, event or user-visible copy: check docs drift.
- The last rollout stage closed: hand the release to the SRE.

Not for: the Test verdict and independent evidence re-runs (`verification-gate`), code review findings (`multi-axis-code-review`), CI gates, rollout mechanics and how to run a rehearsal (`deployment-pipeline`), incidents and postmortems (`operations-and-incidents`), the retro (`retrospective`), or implementing tasks (`executing-plans`).

## What is included

- `SKILL.md`: Step 0 state discovery and mode table; pre-ship checklist; docs drift; PR body; integration menu; integrate after Test sign-off; release notes; runbook; R1–R9 and go/no-go; handover to Operate. Also an anti-rationalization table, critical rules and 5 examples.
- `references/pre-ship-checklist.md`: P1–P14 with commands, pass conditions, the record format, the Quick variant and common false passes.
- `references/integration-options.md`: environment detection, the exact menus, push/PR, keep, merge preconditions and post-merge tree check, provenance-based cleanup, and the discard inventory with the typed phrase.
- `references/pr-evidence.md`: Developer vs Reviewer sections, smallest-visual catalogue, before/after evidence tiers, door and blast radius, the rollback line, Developer Verification rows and Review guide readiness.
- `references/docs-drift-check.md`: public surfaces, search commands, commit-order verdicts (current / stale / can't tell), required docs, routing to the Tech Writer.
- `references/release-and-handover.md`: release-notes field rules, the evidence that counts for R1–R9, runbook rules, SemVer and CHANGELOG, the sign-off brief, Deploy log discipline, the handover format and the Quick variant.
- `prompts/release-notes-writer.md`: fresh-context release-notes draft from the PR, spec and staging records, with an inline fallback.
- `prompts/runbook-fresh-reader.md`: on-call reader test (only the runbook and the alert text), with an inline fallback.
- `evals/evals.json`: 5 scenarios (open the PR, pressure to merge without review, discard, release with a stale runbook, handover).
- `evals/trigger-eval.json`: 19 trigger queries (11 positive, 8 negative).
- Adds to `agentic-sdlc`: `templates/runbook.md` (header with Last verified and next due date, alerts, rollback, escalation, change log, verification log).
- Uses from `agentic-sdlc`: `templates/pr-body.md`, `templates/release-notes.md`, `scripts/spec-lint.mjs`, `scripts/plan-graph.mjs`, `scripts/lib/git.mjs` (`fingerprint()`).

## Typical invocation

- "All tasks are committed and the DoD is green. Open the PR."
- "We're done with feature/csv-export. What are my options?"
- "Drop the bulk-delete experiment and its worktree."
- "PR #138 is merged. Prepare the v2.14.0 release notes and the go/no-go."
- "The rollout hit 100%. Hand it over to the SRE."
- "Does this diff make any docs or the migration guide stale?"

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| SP-67 | Superpowers (MIT) | Finishing a branch: exact option menu, re-test of the merged result, typed `discard` confirmation, provenance-based worktree cleanup | Merge appears only after a Test sign-off on the head SHA and the human merges; discard is never in the menu and needs `discard <branch>` in a later turn after a full inventory; cleanup only under `.worktrees/` or `worktrees/`, never `--force`; the merged-tree check decides whether the fingerprint carries over |
| SP-37 | Superpowers (MIT) | Status contract for worker reports | Every step ends in DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT, with the failing checklist item numbers |
| SP-39 | Superpowers (MIT) | No-subagent contract | Both prompts run inline in a cleared pass, labelled `self-review` |
| BM-37 | BMad Method (MIT) | Standalone prompts runnable in another session | Prompts list their exact inputs so they can be pasted into a fresh session |
| MP-73 | Matt Pocock skills (MIT); Summary visuals credited there to Dex Horthy's `show-me` (HumanLayer) | PR body: smallest visual, before/after evidence tiers, one-way/two-way door, blast radius | Placed as labelled items under the template's Summary; a Rollback line copied verbatim from the spec sits beside the door; a one-way door below Full routes up via the `irreversible` trigger |
| MP-05 | Matt Pocock skills (MIT) | Handoff document: reference artifacts, don't duplicate; redact | The handover links the spec, release notes and runbook and adds only production links, due dates and open items |
| MP-65 | Matt Pocock skills (MIT) | Debug cleanup checklist | Pre-ship P8: no probes, `.only(`, `.skip(` or `[debug-` lines in the diff |
| AO-63 | Addy Osmani agent-skills (MIT) | Docs drift detected by commit order | Commit-order verdicts current / stale / can't tell; "can't tell" is never reported as current |
| AO-64 | Addy Osmani agent-skills (MIT) | Prose review that preserves facts | The release-notes writer copies numbers, commands and SHAs exactly and marks absent values `MISSING` |
| AO-76 | Addy Osmani agent-skills (MIT) | Pre-commit hygiene, staged secret grep | Pre-ship P7 lists matching file names only and never prints the values |
| AO-77 | Addy Osmani agent-skills (MIT) | SemVer, tag as the source of truth, human changelog | Version rules (a relied-on behaviour change is MAJOR; unsure → breaking); CHANGELOG groups written by the Tech Writer |
| AO-90 | Addy Osmani agent-skills (MIT) | Rollback plan mandatory before GO | Rollback copied verbatim from the spec into PR and release notes; rehearsal on the same SHA ≤ 7 days old (R3) |
| AO-91 | Addy Osmani agent-skills (MIT) | Pre-launch checklist and post-launch verification | Pre-ship P1–P14 before the PR; R1–R9 and Deploy log rows per watch window after it |
| AO-93 | Addy Osmani agent-skills (MIT) | Ship GO/NO-GO; default NO-GO; rollback mandatory | Any false go/no-go criterion → NO-GO and no sign-off request |
| AO-100 | Addy Osmani agent-skills (MIT) | Migration guide and deprecation notice | A contract-breaking change needs a migration guide before the PR opens; routed to the Tech Writer |
| BM-24 | BMad Method (MIT) | Local commit, never push without instruction; terse completion summary | Push only on the menu reply in a later turn; feature branch only |
| BM-65 | BMad Method (MIT) | Launch plan with go/no-go criteria and a rollback owner | Release sign-off brief: go/no-go count, rollback with rehearsal time, rollout thresholds, residual risks with owners |
| BM-69 | BMad Method (MIT) | Fresh reader given only the document; three least-confident decisions | Runbook fresh-reader test; the release-notes writer reports its three least-confident values |
| BM-72 | BMad Method (MIT) | Reader calibration | `## For users` and the runbook are written for their reader (affected user; on-call engineer at 03:00) |

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-24 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | devops |
| Tags | agentic-sdlc, release, pull-request, runbook, release-notes, docs-drift, handover |
| Risk | medium |
