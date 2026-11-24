# Prompt — fresh-context plan review

Use in Step 6 of the workflow, after the self-review (`../references/self-review-and-readiness.md` §1) passes 12/12 and `plan-graph` exits 0. Send it to a fresh subagent that did not write the plan. If the platform has no subagents, run the prompt yourself in a fresh pass after clearing working notes, read only the inputs listed below, and label the result `self-review (no subagent)` in the approval request.

Bounds: at most 2 review rounds per plan revision; each round uses a new fresh context. A Critical finding open after round 2 → `BLOCKED`, routed by cause (`../references/self-review-and-readiness.md` §3).

Fill every `{{…}}` and paste the content. Never paste the planning conversation, the Planner's notes or earlier reviewers' reasoning; a round-2 reviewer receives the revised plan and the round-1 findings table only.

---

```markdown
You review an Agentic SDLC plan before its Design sign-off. You did not write it. Your job is to find what would make a fresh Developer fail, collide or build the wrong thing. Do not rewrite the plan; report findings.

## Inputs
- spec.md rev {{R}} (approved), pasted: {{header, Acceptance criteria table, Non-goals, Constraints, Rollback}}
- plan.md rev {{N}}, pasted in full: {{plan}}
- plan-graph output: {{the summary lines: waves, conflicts, review, planHash}}
- Code map modules touched: {{module · paths · depends_on · tests}}
- DoD block: {{sdlc-dod lines}}
- Review round: {{1 | 2}}; round-1 findings (round 2 only): {{table or "n/a"}}

## Checks (run all; cite task IDs and quote the plan text)
1. Coverage: every AC has a task whose red test proves the AC's full text, including refusal and error clauses; every task serves its listed AC.
2. Self-containment: give each task to an imaginary Developer who sees only its row, its subsection, its AC text and its files. List every task where that Developer would have to guess.
3. Interfaces: every name, type, status code, header, config key and metric used across tasks matches its defining task exactly.
4. Collisions: find two tasks that each obey the plan but together break the build or each other (same function edited two ways, a migration ordering clash, a config key with two defaults, a registry both append to in one wave). File overlap is already serialized by plan-graph; look for semantic collisions plan-graph cannot see.
5. Dependencies: every Blocked by edge is real (the task needs code, schema or an interface from the blocker); every real need has an edge. Flag false edges that shrink the frontier.
6. Slicing: no horizontal layer tasks; tracer bullet first after any prefactor; the least certain work early; no task above 8h or with more than 6 steps.
7. TDD: each red step names a test with an AC ID, an exact command and the expected failure; at most one --no-red task; mocks only at process boundaries; CHAR-n before changing untested code.
8. Risk and path: schema, public API, auth, money, personal data or irreversible changes the spec score does not list; Standard plans above 15 files; expand–contract missing where live callers or stored data would break.
9. Impact and dependencies: every touched path in a code-map module; Regression scope runs the mapped tests; every new package has a Dependencies row.
10. Placeholders: TBD, "handle errors", "similar to Tn", "as needed", "appropriate", unnamed helpers.

## Severity
- Critical: Build would produce wrong behaviour, break the build, collide, skip an AC, or bypass a bound or approval.
- Important: a Developer would likely stop with NEEDS_CONTEXT or BLOCKED, or Build would be markedly slower (false edges, missing files).
- Minor: wording, naming, ordering that does not change the outcome.

## Output (exactly this shape)
Verdict: READY | NOT READY   (NOT READY when any Critical or Important finding is open)

| # | Severity | Task | Check | Finding (quote) | Fix proposed |
|---|---|---|---|---|---|

Coverage matrix:
| AC | Tasks | Red tests that prove it | Gap |
|---|---|---|---|

Collisions examined: <pairs of tasks checked under check 4, with "none found" or the finding #>
Declined to judge: <items outside the inputs (for example runtime performance), with the reason>
```

---

## Using the result

| Verdict | Action |
|---|---|
| `READY`, 0 findings | Proceed to the readiness checklist |
| `READY` with Minor findings | Fix the cheap ones; list the rest under Risks only if they affect Build |
| `NOT READY` | Fix every Critical and Important finding, add a Revision log row only if the plan was already approved, re-run `plan-graph --write` and the self-review, then round 2 with a new fresh reviewer |
| Finding disputed | Keep the plan text, record the finding and the reason in the approval request as a residual risk with the accepting role; never drop it silently |

Record in the request: reviewer type (subagent or `self-review (no subagent)`), rounds, findings fixed by severity, findings open with their accepting role.
