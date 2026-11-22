# <Feature> — Plan

<!--
Template for specs/NNN-slug/plan.md (Design stage). Mechanisms 7.1 (task table), 7.2 (plan graph),
7.5 (impact), 6.3 (loop ledger), 11.3 (dependency note), 10.2/K8 (combined review).
Fill every section. A section with nothing to record holds one line: `none — <reason>`.
Validate with: node <skill>/scripts/plan-graph.mjs specs/NNN-slug/plan.md --write
Delete these comment blocks when the plan is filled in.
Sources: task-table and slicing conventions adapted from Superpowers `writing-plans` (MIT),
Matt Pocock `to-tickets` (MIT) and Addy Osmani `planning-and-task-breakdown` (MIT).
-->

**Path:** Standard · **Spec:** `specs/NNN-slug/spec.md` rev 1 (its hash is recorded in `## Approvals`) · **ADRs:** none — <reason> | `docs/adr/NNNN-slug.md`

> **For the executor:** run this plan with the `executing-plans` skill, one task per fresh context, in the order of `graph.json` waves. Never start a task before its `Blocked by` tasks have a commit carrying their ID.

## Goal and architecture

**Goal:** <one sentence: the user-visible outcome the spec asks for>

**Architecture:** <2–3 sentences: modules involved, data flow, the decision each ADR fixes>

**Tech stack:** <languages, frameworks, test runner, the DoD commands from the AGENTS.md `sdlc-dod` block>

## Tasks

<!--
Rules (checked by plan-graph, exit 1 on any violation):
- ID: T1..Tn, unique, in creation order. Never renumber after Design sign-off; a removed task keeps its ID out of use.
- AC: ≥ 1 acceptance-criterion ID from spec.md (AC-n). A prefactor or setup task lists the AC it enables.
  Every AC in the spec has ≥ 1 task.
- Blocked by: task IDs that must be committed first, or "—". Unknown IDs and cycles fail.
- Files: every file the task creates or modifies, in backticks, comma-separated, tests included.
  Two tasks in the same wave that share a file are serialized by plan-graph (the lower ID goes first).
- Size: hours or days, ≤ 1 day (8h). A larger task is split before the plan is presented.
- Count: ≤ 15 tasks per plan; more → split the spec into two specs.
-->

| ID | Title | AC | Blocked by | Files | Size |
|---|---|---|---|---|---|
| T1 | <verb + object, one vertical slice> | AC-1 | — | `src/<module>/<file>`, `test/<module>/<file>` | 4h |
| T2 | <verb + object, one vertical slice> | AC-2 | T1 | `src/<module>/<file>`, `test/<module>/<file>` | 1d |

## Task details

<!--
One subsection per task row. The Implementer receives only its row, its subsection, the AC text it
serves and the files it lists, so each subsection is self-contained. Interface signatures are fixed
here, before any code (references/tdd.md). Steps are 2–5 minutes each.
-->

### T1 — <title>

**AC:** AC-1 · **Blocked by:** — · **Files:** `src/<module>/<file>` (create), `test/<module>/<file>` (create)

**Interface:**

```text
<exact function, endpoint or component signature, with parameter and return types>
```

1. **Red.** Write the test `AC-1 <behaviour it proves>` in `test/<module>/<file>`. Run `<exact test command>`. Expected: FAIL with `<expected failure message>`. Paste the failing output into the task's evidence record.
2. **Green.** Write the minimal code in `src/<module>/<file>`. Run `<exact test command>`. Expected: PASS (`<n>` tests).
3. **Refactor.** Remove duplication; tests stay green with the same command.
4. **Commit** with the trailer:

   ```text
   <type>(<scope>): <summary>

   Refs: T1 AC-1
   ```

### T2 — <title>

**AC:** AC-2 · **Blocked by:** T1 · **Files:** `src/<module>/<file>` (modify), `test/<module>/<file>` (create)

**Interface:**

```text
<signature>
```

1. **Red.** <test name with AC-2, command, expected failure>
2. **Green.** <minimal change, command, expected pass>
3. **Refactor.** <what to tidy; tests stay green>
4. **Commit** with `Refs: T2 AC-2`.

## Impact

<!--
Mechanism 7.5. Source: docs/codemap.md (templates/codemap.md). One row per module touched by any
task's Files. Dependents = modules whose depends_on lists this module. Mapped tests = the module's
tests entry plus the dependents' tests entries.
A touched path that belongs to no module in the map → update docs/codemap.md first (project-context),
then fill this table. No docs/codemap.md in the project → Code map line says `absent — <reason>`,
Dependents = "not mapped" and the regression scope is the full DoD test command.
-->

**Code map:** `docs/codemap.md` (updated YYYY-MM-DD)

| Module | Paths touched | Change | Dependents | Mapped tests |
|---|---|---|---|---|
| <module from the map> | `src/<module>/<file>` | new file / modify | <dependent modules> | `test/<module>/**` |

**Regression scope** (scoped re-check after every fix, `references/loops.md`): `<test command limited to the mapped tests>`. The full DoD suite runs at loop exit and before the PR.

## Dependencies

<!--
Mechanism 11.3 and references/rules.md rule 10. One row per new or upgraded third-party package.
Approved together with the plan; a dependency added in Build without a row here → halt (unattended)
or Important review finding. No new dependency → the single line `none — <reason>`.
-->

| Package | Exact version | License | Last release | Critical/high advisories | Audit command | Lockfile committed | Typosquat check | Reason |
|---|---|---|---|---|---|---|---|---|
| <name> | <x.y.z> | <SPDX id> | <YYYY-MM-DD, ≤ 12 months old> | 0 | `<npm audit / pip-audit / osv-scanner>` | yes | <checked against the registry's canonical name> | <why the standard library or existing code is not enough> |

## Risks

<!-- Residual risks presented with the approval request. Each row names who accepts it. -->

| Risk | Likelihood (low/med/high) | Mitigation in this plan | Accepted by |
|---|---|---|---|
| <risk> | <level> | <task ID or check> | <role> |

## Loop ledger

<!--
Mechanism 6.3. Excluded from the plan hash: appending rows never voids Design sign-off.
Rows come from `run-ledger render` (references/loops.md): one row per failed round, per round that
fixed a failure, per ruling and per halt. Loop: red-green | build-test | review-fix | debug (plus
`ruling` and `halt` rows). Cause: spec | design | plan | code | test | env | unknown; a second
`unknown` on one task is treated as `design` (breaker B6). Result: failed | fixed | escalated.
Signature = first failing test + first error line. The same signature in 2 consecutive rounds, or
3 failed fixes on one task → Result `escalated` and a design question for the Architect.
Waves are the plan-graph frontier waves in graph.json; a red DoD after merging a wave's worktrees
is a `build-test` round on the task whose files the failure names.
-->

| Date | Task | Loop | Round | Failure signature | Cause | Tried | Result |
|---|---|---|---|---|---|---|---|

## Revision log

| Rev | Date | Change | Reason |
|---|---|---|---|
| 1 | YYYY-MM-DD | First plan from spec rev 1 | — |

## Approvals

<!--
Plan hash = first 12 hex chars of SHA-256 over this file without the "## Approvals" and
"## Loop ledger" sections (plan-graph prints it as planHash). Spec hash = the spec's own hash
(spec.md body without its "## Approvals" section). Any edit outside those two sections changes the
plan hash and voids the approval.
Sign-off values: "Design" or "Specify + Design (combined)". Combined is allowed only on the Standard path
with ≤ 5 tasks (rule K8); otherwise Specify and Design sign-offs are two reviews. A combined review is
one request covering both files: spec.md records the Product Owner's answer, this file records the
Tech Lead's answer, both with Sign-off = "Specify + Design (combined)" and the same Spec hash.
Only an explicit "yes"/"approved" from the named role in a later turn counts.
Check: node <skill>/scripts/plan-graph.mjs specs/NNN-slug/plan.md --check-approval
-->

| Sign-off | Plan rev | Plan hash | Spec rev | Spec hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|
