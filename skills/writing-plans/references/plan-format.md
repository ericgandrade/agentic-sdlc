# Plan format — `specs/NNN-slug/plan.md`

Load this file in Steps 2–4 of the workflow, while filling the template. The template itself is `../../agentic-sdlc/templates/plan.md`; the validator is `../../agentic-sdlc/scripts/plan-graph.mjs`. This file explains every field, the rule behind it and the `plan-graph` error code that enforces it. Where this file and the template or script disagree, the template and script win.

## 1. Section order

| # | Section | Required content | In plan hash |
|---|---|---|---|
| 0 | H1 `# <Feature> — Plan` | Feature name in the spec's vocabulary | yes |
| 1 | Header line | `**Path:**` · `**Spec:**` path and rev · `**ADRs:**` list or `none — <reason>` | yes |
| 2 | Executor note | The blockquote "For the executor" from the template, unchanged | yes |
| 3 | `## Goal and architecture` | Goal (1 sentence), Architecture (2–3 sentences), Tech stack with the `sdlc-dod` commands | yes |
| 4 | `## Tasks` | The task table (§2) and at most one short paragraph naming the prefactor, the tracer bullet and any file conflict | yes |
| 5 | `## Task details` | One `### Tn — <title>` per row (§4) | yes |
| 6 | `## Impact` | Code map line, module table, Regression scope line (§6) | yes |
| 7 | `## Dependencies` | One row per new or upgraded package, or `none — <reason>` | yes |
| 8 | `## Risks` | Residual risks with likelihood, mitigation and accepting role | yes |
| 9 | `## Loop ledger` | Header row only at Design; Build and Test append rows | **no** |
| 10 | `## Revision log` | One row per plan revision | yes |
| 11 | `## Approvals` | Design sign-off row(s) | **no** |

A section with nothing to record holds one line `none — <reason>`. Delete the template's HTML comments when the plan is filled in; `plan-graph` strips comments before counting words, so a forgotten comment costs nothing in the budget but confuses the Developer.

**Header fields.**

- `Path` copies the spec header exactly (`Standard` or `Full`). A different value fails with `PATH_MISMATCH`; `Quick` fails with `PATH_QUICK`; a missing Path is read as Standard with the warning `PATH_DEFAULT`.
- `Spec` names `specs/NNN-slug/spec.md` and the revision the plan was built on. The spec hash is recorded in `## Approvals`, not in the header, so a spec revision does not silently edit the plan.
- `ADRs` lists each `docs/adr/NNNN-slug.md` in status Proposed, or `none — <reason>` where the reason states why no decision is expensive to reverse (new route behind a flag, internal module, existing store reused).

**Prose budget.** `WORD_BOUND` fails above 3,000 words on Standard and 6,000 on Full, counted without code fences, the Loop ledger and the Approvals sections. A plan near the bound is a plan with too much narrative: move rationale into an ADR, cut repeated context, keep commands and signatures.

## 2. The `## Tasks` table

The header row is fixed, in this order: `| ID | Title | AC | Blocked by | Files | Size |`. `plan-graph` locates the columns by name; extra columns are ignored by the script but are not part of the contract, so do not add them.

| Column | Format | Rule | Code |
|---|---|---|---|
| ID | `T1`, `T2`, … (regex `^T\d+$`) | Unique, in creation order. Never renumbered after Design sign-off. A removed task keeps its ID out of use; the gap gives the warning `ID_GAP` and is correct | `BAD_ID`, `DUPLICATE_ID`, `ID_GAP` (warning) |
| Title | Verb + object in the spec's domain words | Names the user-visible behaviour of the slice, not the layer ("Refuse request 101 with 429", not "Add middleware") | `NO_TITLE` |
| AC | `AC-1, AC-4` | ≥ 1 active AC ID of the spec. A prefactor or setup task lists the AC it enables. Every active AC appears in ≥ 1 row. "Retired in rev N" ACs are not active | `NO_AC`, `UNKNOWN_AC`, `UNCOVERED_AC` |
| Blocked by | `T1, T3` or `—` | Real prerequisites only (§3). `—`, `–`, `-`, `none` and `n/a` all mean none | `UNKNOWN_DEP`, `CYCLE` |
| Files | `` `src/a.ts`, `test/a.test.ts` `` | Every file the task creates or modifies, tests included, each in backticks. A directory ends in `/`; a glob is cut at its first `*` for overlap checks | `NO_FILES` |
| Size | `2h`, `0.5d`, `90m`, `1d` | ≤ 8h (`1d` = 8h). A larger task is split, never re-estimated down (`references/slicing.md` §4) | `BAD_SIZE`, `SIZE_BOUND` |

Table-level bounds: ≥ 1 task (`NO_TASKS`) and ≤ 15 tasks (`TASK_BOUND`; more → split the spec in the Specify stage). The Standard path also stops at 15 changed files (`../../agentic-sdlc/references/paths.md` §4): count the distinct paths in the Files column, lockfiles and generated files excluded (`paths.md` §2); 16 or more → stop and re-score the path with the Analyst instead of trimming the list.

**Files rules in practice.**

- List files, not modules: `src/limits/redis-store.ts`, not `limits`.
- Include every test file and every fixture the task writes. A test file shared by two tasks is a file conflict and is handled by waves; that is acceptable and often unavoidable.
- A generated file (lockfile, snapshot, migration timestamp file) is listed when the task commits it: `package-lock.json`, `migrations/` (directory form when the file name is generated).
- A directory or glob entry serializes every task that touches anything under it. Use it only when the exact name is unknowable; prefer exact names to keep the frontier wide.
- The Developer is told that a file outside its Files list is out of scope (`BLOCKED`, not a silent edit). Missing a file here turns into a blocked task in Build.

## 3. `Blocked by` — the real-dependency test

Write `Tb` in Ta's `Blocked by` only when one of these is true:

1. Ta calls, imports or renders code that Tb creates.
2. Ta reads or writes a schema, table, column, config key or message format that Tb creates.
3. Ta's red test cannot be written without an interface Tb fixes (the interface lives in Tb's subsection).
4. Ta is the contract phase of an expand–contract sequence and Tb is a migrate batch (`references/slicing.md` §5).

Not reasons: "it is in the same file" (`plan-graph` serializes overlap), "it feels later", "the reviewer may want to see Tb first", "Tb is bigger". Every false edge removes a task from the parallel frontier. For each edge, finish the sentence "Ta cannot start before Tb because Ta needs ___ from Tb"; an edge whose blank cannot be filled with a symbol, file or schema object is deleted.

## 4. Task subsections (`## Task details`)

The Developer receives only its row, its subsection, the AC text, the listed files and the DoD block (`prompts/task-brief.md`). The subsection must therefore stand alone.

```markdown
### T4 — <same title as the row>

**AC:** AC-4 · **Blocked by:** T2 · **Files:** `src/limits/redis-store.ts` (create), `test/limits/redis-store.test.ts` (create), `src/metrics/registry.ts` (modify)

**Interface:**

    <exact signature: names, parameter and return types, status codes, error bodies, null semantics>

1. **Red.** Test `AC-4 <behaviour>` in `<test file>`. Run `<exact command>`. Expected: FAIL with `<expected failure line>`.
2. **Green.** <minimal change>. Same command. Expected: PASS (<n> tests).
3. **Refactor.** <what to tidy, or "none beyond naming">; tests stay green.
4. **Commit** `<type>(<scope>): <summary>` with trailer `Refs: T4 AC-4`.
```

Field rules:

| Field | Rule | Source |
|---|---|---|
| Line 1 | Same AC, Blocked by and Files as the row; each file marked `(create)` or `(modify)` (or `(delete)`) | template |
| Interface | Fixed before code. Types, HTTP status, error body, `null`/empty semantics, config keys with defaults. A dependent task codes against this text; a missing signature makes the Developer answer `NEEDS_CONTEXT` | `../../agentic-sdlc/references/tdd.md` |
| Red | Test names contain the AC ID. Exact command scoped to the test file (`-t "AC-2(?![0-9])"` when sharing a file; the lookahead keeps `AC-20` out, `../../agentic-sdlc/references/artifacts.md` §Naming and numbering). The expected failure is the one the missing behaviour causes (`Failed to load url`, `expected 429 to be 200`), never a syntax or import error of the test itself | tdd.md |
| Green | Minimal code, same command, number of passing tests | tdd.md |
| Refactor | Concrete or "none beyond naming" | tdd.md |
| Commit | Conventional Commit subject; trailer `Refs: Tn AC-n` listing every AC the task serves. `executing-plans`, `plan-graph --from-git` and `trace-check` read the trailer | `../../agentic-sdlc/references/artifacts.md` |
| Agent | Optional `**Agent:** Tech Writer` when the docs trigger fires; default is the Developer | `../../agentic-sdlc/references/agents.md` |

Each numbered step is one action of 2–5 minutes. A task with more than 6 steps is two tasks.

**Tasks without executable behaviour** (docs, configuration, infrastructure, pure deletion): replace Red/Green with a **Check** step that runs a verification command with an expected result (`npm run docs:check` → 0 broken links; `terraform plan` → `1 to add, 0 to change, 0 to destroy`; a schema validator). Mark it `--no-red "<reason>"`. At most one `--no-red` task per plan (`tdd.md`); a second one means a behaviour is untested or a docs task should merge with the code task it documents.

**Brownfield.** A task that modifies untested legacy code starts with a characterization test `CHAR-n <current behaviour>` that passes before any change, then the red test. List the characterization test file in Files.

**Mocks.** Fake only at process boundaries (network, clock, queue, third-party API). A plan step that says "mock the repository" for in-process code is rewritten to use the real module or a test container.

## 5. Placeholder blacklist

A plan containing any of these is not ready; replace each with the concrete content:

| Placeholder | Replace with |
|---|---|
| `TBD`, `TODO`, `<...>` left from the template, `???` | The value, or an open question raised before the sign-off request |
| "add validation", "handle errors", "add tests" | The rule, the input that breaks it, the error returned, the test name |
| "similar to T3", "as above", "same pattern" | The repeated content; the Developer of T5 never sees T3 |
| "update as needed", "if necessary", "where appropriate" | The decision, made now |
| "use the existing helper" | Its path and signature |
| "appropriate status code", "suitable message" | `429`, `{"error":"rate_limited"}` |
| "run the tests" | The exact command and the expected PASS count |
| "refactor for clarity" without a target | The function or duplication to remove, or "none beyond naming" |

## 6. Impact, Dependencies, Risks

**Impact.** One row per code-map module touched by any Files entry: Module, Paths touched, Change, Dependents (modules whose `depends_on` lists it), Mapped tests (its `tests` globs plus its dependents'). Regression scope = one command running the union of Mapped tests; the Build stage runs it after every fix and the full DoD at loop exit. A file outside every module → stop and update `docs/codemap.md` first (`project-context`), then fill the row. No code map in the project → `**Code map:** absent — <reason>`, Dependents `not mapped`, Regression scope = the full DoD test command.

**Dependencies** (rule 10 in `../../agentic-sdlc/references/rules.md`). Per package: exact version (no range), SPDX license, last release ≤ 12 months old, 0 critical/high advisories with the audit command, lockfile committed, typosquat check against the registry's canonical name, reason the standard library or existing code is not enough. A package failing a bound is replaced or covered by a waiver (`../../agentic-sdlc/references/governance.md`). No new package → `none — <reason>`, naming the existing package reused when there is one.

**Risks.** Each row: likelihood low/med/high, the mitigation inside this plan (a task ID, a test, a flag, a staging measurement), the role that accepts it. The rows are presented with the approval request as residual risks. A risk with no mitigation and no accepting role is an open question, not a risk row.

## 7. Revision log, removed tasks, Approvals

- Revision 1 is "First plan from spec rev N". Every later edit outside the Loop ledger and Approvals adds a row (rev, date, change, reason) and voids the Design sign-off (`APPROVAL_VOID`; `APPROVAL_REV` when the approved rev is not the latest).
- A removed task is deleted from the table and from `## Task details`; its ID is never reused, and the Revision log row states "T4 removed: <reason>". `plan-graph` reports the gap as `ID_GAP` (warning only).
- A task added after sign-off takes the next unused ID, even if lower IDs were removed.
- Approvals columns, fixed: `Sign-off | Plan rev | Plan hash | Spec rev | Spec hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision`. `plan-graph --check-approval` requires `sign-off`, `plan rev`, `plan hash`, `spec hash`, `role`, `person`, `exact words` and `decision` (`APPROVAL_COLUMNS`), uses the last row whose Decision starts with `approved`, and fails with `APPROVAL_MISSING`, `APPROVAL_VOID`, `APPROVAL_SPEC_VOID`, `APPROVAL_FIELD`, `APPROVAL_REV` or `COMBINED_NOT_ALLOWED`.

## 8. Standalone plans

`docs/plans/YYYY-MM-DD-<feature>.md`, same template. Replace the Spec reference with the requirement source, add `## Requirements` listing `AC-1..AC-n`, validate with `--no-spec` (AC existence and coverage are not checked by the script, so run the coverage check of `references/self-review-and-readiness.md` §2 by hand). The approval row uses Sign-off `Design`, Spec rev and Spec hash `n/a`.

† Added in a later release; manual fallback in `../../agentic-sdlc/references/artifacts.md` §Later-release files.
