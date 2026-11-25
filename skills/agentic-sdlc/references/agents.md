# Agentic SDLC — Agent Index

Thirteen agents, named by function. Each agent file in `agents/` is a self-contained brief (≤ 600 words): what it reads, what it never sees, its skills, what it may do, what it never does, its tool list and its report. Load an agent file only when dispatching that agent. Core agents run on their stages; specialists run only when their trigger fires, so the Quick path stays at four roles.

| Agent | File | Kind | Stages | Dispatched by | Tool profile | Returns |
|---|---|---|---|---|---|---|
| **Scrum Master** | `agents/scrum-master.md` | Core, played by the router | All | — (router loads it at transitions) | read · edit `impediments.md`, retro drafts · run `status` | progress line, impediment log, escalations, retro draft |
| **Analyst** | `agents/analyst.md` | Core | Discover, Specify (Quick: score + issue acceptance test) | Router | read · edit `spec.md`, `GLOSSARY.md`, codemap · run `spec-lint` | path score, intake record, `spec.md`, Specify sign-off request |
| **Product Manager** | `agents/product-manager.md` | Specialist | Discover, Specify (critique), Operate (indicator) | Analyst; SRE | read · comment on the issue | PM brief (problem, outcome, indicator, priority), spec critique |
| **UX Designer** | `agents/ux-designer.md` | Specialist | Specify, Design (consulted), Test (UX checks) | Analyst; Reviewer | read · edit `ux.md` · run accessibility scanners | `ux.md` (journeys, state table, copy, accessibility), UX findings |
| **Planner** | `agents/planner.md` | Core | Design | Router | read · edit `plan.md`, `graph.json`, `docs/adr/**` · run `plan-graph` | `plan.md`, `graph.json`, Design sign-off request |
| **Architect** | `agents/architect.md` | Specialist | Design; loop escalations | Planner; loop anti-thrash | read · edit `docs/adr/**`, `plan.md` design notes | ADRs, interface notes, design rulings |
| **Developer** | `agents/developer.md` | Core | Build | Router / `executing-plans`, one per task | read · edit files listed in the task · run DoD and test commands · git local | task report, commits, evidence records |
| **Test Engineer** (the Tester) | `agents/test-engineer.md` | Specialist | after Design sign-off → Test | Router / Reviewer | read at base commit · edit test files + `acceptance-tests.md` · run tests | acceptance tests mapped AC-n → test id, state and NFR coverage |
| **Reviewer** | `agents/reviewer.md` | Core, read-only | Test | Router | read · run test/DoD/check scripts · write PR sections only | verdict GO / NO-GO, triage log |
| **Security Auditor** | `agents/security-auditor.md` | Specialist | Specify, Test | Analyst (R ≥ 1); Reviewer (lens L3) | read · edit `threat-model.md`, spec Security notes · run scanners | threat model, `sec` findings, compliance mapping when `regulated` |
| **Tech Writer** | `agents/tech-writer.md` | Specialist | Build (docs task), Release | Router / `executing-plans`; Release Engineer | read · edit `docs/**`, README, `CHANGELOG.md`, release-notes user section | docs diff, migration guide, `## For users` |
| **Release Engineer** | `agents/release-engineer.md` | Specialist | Release | Router after PR merge | read · edit release notes, runbook · run staging commands | release checklist, go/no-go brief |
| **SRE** | `agents/sre.md` | Specialist | Operate | Router after release; alerts | read · edit `ops.md`, postmortems · read-only production queries | ops record, incident record, production facts for the retro |

## Triggers

| Specialist | Dispatched when |
|---|---|
| Product Manager | A new feature or changed outcome on Standard; always on Full; at the first indicator reading |
| UX Designer | The change touches a user-facing surface: screen, page, component, CLI output or flags, user-visible message, public API developer experience |
| Architect | Full; or a schema, public API, new component or cross-service contract; or a loop anti-thrash escalation |
| Test Engineer | Standard and Full (Quick: the acceptance test lives in the issue) |
| Security Auditor | R ≥ 1 at Specify; review lens L3 at Test; `regulated` → also maps controls to the obligations (`references/security.md` §Compliance) |
| Tech Writer | Docs task: a user docs page, API or configuration reference, or migration guide must change, or Full · Release user section: user-visible behavior changes |
| Release Engineer | A production deploy |
| SRE | A production release; alerts and incidents |

## Activation per path

| Path | Agents |
|---|---|
| Quick | Scrum Master (router), Analyst (path score + acceptance test in the issue), Developer, Reviewer; + Release Engineer when production deploys; specialists only on their triggers |
| Standard | + Analyst, Planner, Test Engineer, SRE; Product Manager, UX Designer, Security Auditor, Tech Writer, Architect on their triggers |
| Full | All 13; Architect, Product Manager and Tech Writer always |

## Separation of duties

| Never the same context | Why |
|---|---|
| Developer ↔ Reviewer, Test Engineer | Nobody verifies, tests the AC of, or approves their own work |
| Analyst ↔ Planner (Full) | The plan is checked against the spec by a context that did not write the spec |
| Product Manager, UX Designer ↔ the spec author | Critique comes from a fresh context |
| Any agent ↔ a human sign-off | Agents request sign-offs; only the named human gives them (`references/governance.md` §RACI) |

## Dispatch rules

- **Fresh context per dispatch.** Give the agent its file, the artifacts listed under "Reads" and nothing else (`references/phase-boundaries.md` §Context hygiene).
- **Tool lists are allow lists.** A subagent's tool list is a subset of its delegator's. Platform tool names per host: `references/platforms.md`.
- **No subagents on the platform** → run the agent inline as a separate, labelled pass: start with `--- <Agent> pass ---`, load only its brief and inputs, and label every check of the author's own work `self-review` in the PR.
- **Authority (all agents).** No push to the default branch, merge, deploy, release, tag or secret access without a human decision in the same session; in unattended mode no push at all (`references/autonomous.md`). An attempt → halt `authority`.

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

Severity scale: **Critical** (blocks Test and Release sign-off; never deferred) · **Important** (fix, or defer with owner acceptance and an issue) · **Minor** (deferred list).

A report that lacks the status line or evidence for a `DONE` claim is treated as `BLOCKED: report incomplete` and re-requested once; a second incomplete report escalates to the human.
