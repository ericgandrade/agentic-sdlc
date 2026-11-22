# Agentic SDLC — Agent Index

Eight agents, named by function. Each agent file in `agents/` is a self-contained brief (≤ 600 words): what it reads, what it never sees, its skills, what it may do, what it never does, its tool list and its report. Load an agent file only when dispatching that agent.

| Agent | File | Kind | Stages | Dispatched by | Tool profile | Returns |
|---|---|---|---|---|---|---|
| **Planner** | `agents/planner.md` | Core | Plan, Specify, Design | Router | read · edit `specs/**`, `docs/adr/**`, `docs/codemap.md` · run lint scripts | path score, `spec.md`, `plan.md`, approval requests |
| **Implementer** | `agents/implementer.md` | Core | Build | Router / `executing-plans`, one per task | read · edit files listed in the task · run DoD and test commands · git local | task report, commits, evidence records |
| **Reviewer** | `agents/reviewer.md` | Core, read-only | Test | Router | read · run test/DoD/check scripts · write PR sections only | verdict GO / NO-GO, triage log |
| **Architect** | `agents/architect.md` | Specialist | Design; loop escalations | Planner; loop anti-thrash | read · edit `docs/adr/**`, `plan.md` design notes | ADRs, interface notes, design rulings |
| **Test Engineer** | `agents/test-engineer.md` | Specialist | after Plan approval → Test | Router / Reviewer | read at base commit · edit test files + `acceptance-tests.md` · run tests | acceptance tests mapped AC-n → test id |
| **Security Auditor** | `agents/security-auditor.md` | Specialist | Specify, Test | Planner (R ≥ 1); Reviewer (lens L3) | read · edit `threat-model.md`, spec Security notes · run scanners | threat model, `sec` findings |
| **Release Engineer** | `agents/release-engineer.md` | Specialist | Release | Router after PR merge | read · edit release notes, runbook · run staging commands | release checklist, go/no-go brief |
| **SRE** | `agents/sre.md` | Specialist | Operate | Router after release; alerts | read · edit `ops.md`, postmortems, retro · read-only production queries | ops record, incident record, retro actions |

## Dispatch rules

- **Fresh context per dispatch.** Give the agent its file, the artifacts listed under "Reads" and nothing else (`references/phase-boundaries.md` §Context hygiene).
- **Tool lists are allow lists.** A subagent's tool list is a subset of its delegator's. Platform tool names per host: `references/platforms.md`.
- **No subagents on the platform** → run the agent inline as a separate, labelled pass: start with `--- <Agent> pass ---`, load only its brief and inputs, and label every check of the author's own work `self-review` in the PR.
- **Authority (all agents).** No push to the default branch, merge, deploy, release, tag or secret access without a human decision in the same session; in unattended mode no push at all (`references/autonomous.md`). An attempt → halt.

## Report contract (every agent)

```markdown
**Agent:** <name> · **Task:** <Tn / stage> · **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT | CANNOT_VERIFY
**Did:** <bullets with file paths and commit SHAs>
**Evidence:** <command · exit code · fingerprint> (one line per command)
**Concerns / blocker / missing input / not verified:** <required for every status except DONE>
**Next:** <one action the dispatcher takes>
```

| Status | Meaning | Dispatcher action |
|---|---|---|
| `DONE` | Work complete, evidence fresh | Proceed |
| `DONE_WITH_CONCERNS` | Complete, with listed concerns | Read each concern; open an issue or a finding for each one kept |
| `BLOCKED` | Cannot continue; names the blocker and what unblocks it | Resolve or escalate; never re-dispatch the same brief unchanged |
| `NEEDS_CONTEXT` | Missing input named | Supply it or ask the human |
| `CANNOT_VERIFY` | A check was not run; states why, who verifies and when | Record it in the PR Verification table; a Critical AC needs a waiver |

Severity scale: **Critical** (blocks PR and Release approval; never deferred) · **Important** (fix, or defer with owner acceptance and an issue) · **Minor** (deferred list).

A report that lacks the status line or evidence for a `DONE` claim is treated as `BLOCKED: report incomplete` and re-requested once; a second incomplete report escalates to the human.
