# Prompt — task brief for one Developer subagent

Use this template in two places:

1. **Design, Step 8 (dry run).** Fill it for every task before the sign-off request and read each brief alone. A brief that needs anything not in it — another task's subsection, the planning conversation, a file not listed — means the plan is not self-contained; fix the plan, not the brief.
2. **Build.** `executing-plans` Step 3 sends exactly this content to a fresh Developer (or the Tech Writer for a docs task): the task row and its `### Tn` subsection, the AC text, the listed files, the DoD block, `../../agentic-sdlc/references/tdd.md` and `../../agentic-sdlc/references/loops.md`, plus review findings for **this** task only. Never add other tasks' conversations or findings (`../../agentic-sdlc/references/phase-boundaries.md` §Context hygiene).

If the platform has no subagents, run the prompt yourself in a fresh pass after clearing working notes: re-read only the filled brief, do the task, and summarize it in ≤ 5 lines before the next one.

Fill every `{{…}}`. Paste content; do not paste links to content the subagent cannot open.

---

```markdown
You are the Developer for one task of an approved Agentic SDLC plan. Work only on this task.

## Task
Plan: {{specs/NNN-slug/plan.md}} rev {{N}} · plan hash {{planHash}} (Design sign-off recorded)
Branch / worktree: {{feat/NNN-slug or worktree path}} · base commit {{sha}}

| ID | Title | AC | Blocked by | Files | Size |
|---|---|---|---|---|---|
{{the task row, verbatim}}

Blockers committed: {{Tb → commit sha, for each Blocked by; "none"}}

{{the ### Tn subsection, verbatim: AC/Blocked by/Files line, Interface block, Red, Green, Refactor, Commit}}

## Acceptance criteria this task serves (verbatim from spec.md rev {{R}})
{{AC-n | criterion text, one row per AC listed in the row}}

## Files in scope
{{each listed file: path · create | modify · current content pasted for "modify", or "new file"}}
Read-only context you may open: {{interfaces from blocker tasks, by path and signature; "none"}}

## Definition of Done (sdlc-dod block, verbatim)
{{lint / typecheck / test / coverage / coverage_min lines}}
Regression scope (after every fix): {{command from the plan's Impact section}}

## Review findings for this task
{{finding ID · severity · file:line · text; or "none"}}

## Rules
- Test first (tdd.md): run the red step and paste the failing output before writing production code. It must fail for the expected reason. A new test that passes on its first run is deleted and rewritten.
- The interface in the task is fixed. If it is missing or contradicts a blocker's code, stop with NEEDS_CONTEXT; never invent one.
- Touch only the files in scope. Needing another file → stop with BLOCKED and name the file and why.
- Mocks only at process boundaries (network, clock, randomness, third-party APIs). No abstraction without ≥ 2 call sites.
- Bounds (loops.md): red-green 3 attempts; the same failure signature twice in a row or 3 failed fixes → stop with BLOCKED and the signatures. Never weaken a test, threshold or check to get green.
- Never add a dependency the plan does not list. Never commit secrets or real personal data.
- One commit for the task, subject `{{type(scope): summary from the plan}}`, trailer `Refs: {{Tn AC-n …}}`.

## Report (last message, exactly this shape)
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT | CANNOT_VERIFY
Commit: <sha> <subject>
Red: <command> → <first failing line>
Green: <command> → <pass count>
DoD: <each sdlc-dod command → exit code> · fingerprint <working-tree fingerprint>
Files changed: <paths> (must be a subset of Files in scope)
Rounds: red-green <n>, build-test <n>
Concerns / blocker / question / unverified AC: <one per line with file:line, or "none">
```

---

## Status meanings (for the dispatcher)

| Status | Means | Next step in Build |
|---|---|---|
| `DONE` | Red then green recorded, DoD green, one commit with the trailer | Re-run the green test and read the diff before accepting (a claim is not evidence) |
| `DONE_WITH_CONCERNS` | Green, with listed concerns | Triage each concern before the next wave |
| `BLOCKED` | File outside scope, bound reached, approval void | Route by cause (`../../agentic-sdlc/references/loops.md` §2); a plan defect runs the change protocol |
| `NEEDS_CONTEXT` | Interface missing or ambiguous, AC unclear | Planner answers in the plan (a plan edit → new revision and sign-off) |
| `CANNOT_VERIFY` | An AC not exercisable locally | Record who verifies it and when; the Test stage owns it |

## Dry-run checklist (Design)

For each filled brief, answer without opening anything else:

- [ ] Which test is written first, in which file, and what exact line makes it fail?
- [ ] What is the exact signature to implement, with types and error behaviour?
- [ ] Which command proves green, and how many tests pass?
- [ ] Which files may change? Is every file the steps mention in that list?
- [ ] What commit subject and trailer close the task?
- [ ] Does any sentence point to another task ("as in T3", "see above")?

Any "cannot tell" → fix the `### Tn` subsection, re-run `plan-graph --write`, and repeat the dry run for that task.
