# Agentic SDLC — Role Model Implementation Plan

> **For agentic workers:** execute task by task with `executing-plans`; verify after each task.

**Goal:** expand the agent model from 8 to 13 functional roles, so the method covers every role the benchmark methods define (Analyst, Product Manager, UX Designer, Tech Writer, Scrum Master function), while keeping the Quick path light.

**Status:** done 2026-11-24. T1–T9 complete; verification: 123/123 tests, validators OK, budget-check PASS (router 2196/2200), spec-lint and plan-graph `--check-approval` PASS on the worked example (new spec hash `6b4c7f329c93`, the plan hash is unchanged), vocabulary grep clean outside the historical records.

**Inputs:** `docs/research/roles/2026-11-22-role-analysis.md` (§5 target model, §6 change list).

**Owner decisions (2026-11-24):**
- **D1:** rename Implementer → Developer.
- **D2:** one Tester role, a widened Test Engineer.
- **D3:** compliance is absorbed into the Security Auditor on the `regulated` trigger.
- **D4:** the Delivery Lead (Scrum Master function) is played by the router and has its own brief. Renamed **Scrum Master** on 2026-11-24 by owner decision (`agents/scrum-master.md`); "Tech Lead" was rejected because it is the human Design approver.
- **Constraints:**
  - Functional names only; no personas.
  - Human sign-offs stay at 4.
  - Mechanisms, bounds and rules are unchanged except for role assignment.

## Tasks

| # | Task | Files | Done when |
|---|---|---|---|
| T1 | New agent briefs: Analyst, Product Manager, UX Designer, Tech Writer, Delivery Lead | `skills/agentic-sdlc/agents/{analyst,product-manager,ux-designer,tech-writer,delivery-lead}.md` | Same sections as the existing briefs; ≤ 600 words each; triggers per analysis §5.1 |
| T2 | Planner → Design only; Implementer → Developer (`git mv`, all references) | `agents/planner.md`, `agents/developer.md`, every file that names them | No "Implementer" left in scope; tests pass |
| T3 | Agent index: 13 agents, triggers, activation per path, separation-of-duties pairs | `references/agents.md` | Matches analysis §5.1 and §5.4 |
| T4 | Router: agent count, stage lead agents, pointer to the index | `SKILL.md` | budget-check PASS (≤ 2200) |
| T5 | Governance: human roles (+ optional UX Lead and Delivery Lead/Scrum Master) and RACI per stage | `references/governance.md` | Matches analysis §5.2 and §5.3; sign-offs stay at 4 |
| T6 | Stage tables and path activation | `references/lifecycle.md`, `paths.md`, `phase-boundaries.md`, `loops.md`, `autonomous.md`, `review.md`, `verification.md`, `release-ops.md`, `retrospective.md`, `security.md` (compliance on `regulated`) | Consistent agent names |
| T7 | Templates: new `ux.md`; Experience pointer in `spec.md`; Docs row in `pr-body.md`; user section of `release-notes.md` owned by the Tech Writer; Test Engineer state/NFR coverage in `acceptance-tests.md` | `templates/*` | spec-lint and plan-graph still pass on the worked example (hashes updated if body text changes) |
| T8 | Stage skills and example: Analyst/PM critique in `brainstorming`, `grill-me`, `spec-driven-development`; Developer in `executing-plans` and `writing-plans`; worked example; evals; skill README; execution plan decision D10b | `skills/*`, `docs/plans/2026-11-20-agentic-sdlc-execution-plan.md` | Vocabulary grep is clean |
| T9 | Verify | — | 123+ tests pass, validators pass, budget-check PASS, spec-lint/plan-graph `--check-approval` PASS, grep for `Implementer` and "8 agents" returns 0 hits in scope |

## Out of scope

- Historical records: `docs/research/scoring/**`, `inventory/**`, `gap-closure/**` and earlier plans.
- Re-scoring is optional and will be run later if the owner asks.
