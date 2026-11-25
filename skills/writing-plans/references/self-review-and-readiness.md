# Self-review, coverage and Design sign-off readiness

Load this file in Steps 5–7 of the workflow: after the plan is drafted and `plan-graph` exits 0, before the fresh-context plan review, and before the Design sign-off request. The contracts are `../../agentic-sdlc/references/governance.md` §2–4 (approval procedure, records, hash), `../../agentic-sdlc/references/rules.md` (rules 1, 3, 8, 10, 11) and `../../agentic-sdlc/scripts/plan-graph.mjs`. In commands, `<agentic-sdlc>` is the installed `agentic-sdlc` skill directory (in this repository, `skills/agentic-sdlc`).

## 1. Plan self-review — 12 checks

Run every check, in order, by reading the plan as the Developer of each task would. Fix each failure in place, re-run `plan-graph --write`, and record the score (`self-review 12/12`) in the approval request. A check that cannot be fixed inside the plan becomes an open question, raised before the request.

| # | Check | Pass when | Typical fix |
|---|---|---|---|
| 1 | **Spec coverage** | Every active AC maps to ≥ 1 task and every task to ≥ 1 AC (§2) | Add a slice; remove or justify the orphan task |
| 2 | **Placeholder scan** | No entry of the blacklist in `references/plan-format.md` §5 | Write the concrete value |
| 3 | **Self-containment** | Each `### Tn` subsection, read alone with its AC text and DoD block, is enough to start: no "see T3", no "as above" | Repeat the needed content |
| 4 | **Interface consistency** | Every name, type, status code and config key used in task Tn matches the signature in the task that defines it, character for character | Align the names; the defining task wins |
| 5 | **Red is real** | Each red step names a test with an AC ID, an exact command and a failure caused by the missing behaviour | Replace "FAIL" with the expected line |
| 6 | **Files complete** | Every file named in a subsection appears in its row's Files, and vice versa; tests and fixtures included | Add the file to the row (or remove it from the steps) |
| 7 | **Edges real** | Each `Blocked by` passes the real-dependency test (`references/plan-format.md` §3) | Delete the false edge; re-run `plan-graph` |
| 8 | **Slices vertical** | No title names a layer; each red test exercises behaviour from the outside (`references/slicing.md` §1) | Re-slice |
| 9 | **Sizes honest** | Every task ≤ 8h with ≤ 6 steps; no task split by shrinking its estimate | Split on "and" or on the AC |
| 10 | **Bounds and path** | ≤ 15 tasks; Standard ≤ 15 files; no schema, public-API, auth, money or data trigger the spec score omits | Route up with the Analyst (rule 11) |
| 11 | **Impact and dependencies** | Every touched path maps to a code-map module; Regression scope command present; each new package has a full `## Dependencies` row | Update the code map; add the row or remove the package |
| 12 | **TDD discipline** | ≤ 1 `--no-red` task; mocks only at process boundaries; no abstraction with < 2 call sites; `CHAR-n` before changing untested code (`../../agentic-sdlc/references/tdd.md`) | Rewrite the step |

Check 4 is the one most often missed: a method called `clearLayers()` in T3 and `clearFullLayers()` in T7 is a bug the plan ships to Build.

## 2. Coverage check — AC ↔ task, both ways

Rule 8 ("every requirement is proven") starts here: the chain AC-n → task → commit trailer → test is only as complete as this table.

**Forward (AC → tasks).** Every active AC has ≥ 1 task. `plan-graph` fails with `UNCOVERED_AC` otherwise. Print the matrix from the script's own output:

```bash
node <agentic-sdlc>/scripts/plan-graph.mjs specs/NNN-slug/plan.md --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const g=JSON.parse(s).graph;for(const a of g.acs)console.log(a.padEnd(6),g.nodes.filter(n=>n.acs.includes(a)).map(n=>n.id).join(" ")||"UNCOVERED")})'
```

Output for the example plan (`../examples/007-api-rate-limit/plan.md`):

```text
AC-1   T1 T2
AC-2   T3
AC-3   T5
AC-4   T2 T4
AC-5   T6
```

**Backward (task → ACs).** Every task lists ≥ 1 known AC (`NO_AC`, `UNKNOWN_AC`). The script cannot check that the task really serves it; read each red test name against the AC text:

| Finding | Meaning | Action |
|---|---|---|
| A task's red test proves nothing in its AC's text | Mislabelled AC, or scope outside the spec | Relabel, or raise a spec change (change protocol) |
| An AC is "covered" only by a prefactor | No task proves the behaviour | Add the slice that proves it |
| An AC has a happy-path test but its refusal or error clause has none | Partial coverage | Add a red test (or a task) for the clause |
| An AC names a metric, header or message the plan never sets | Partial coverage | Add the step to the slice that owns it |
| An AC is not testable locally (staging alert, third-party callback) | Coverage deferred | Keep the task; mark the verification `CANNOT_VERIFY` path in Risks with who verifies it and when |

Standalone plans (`--no-spec`) get no `UNCOVERED_AC` from the script: run both directions by hand against the `## Requirements` list.

## 3. Fresh-context plan review

After the self-review, the plan is reviewed by a context that did not write it, using `../prompts/plan-reviewer.md`. The reviewer reads the spec, the plan, `graph.json` and the code map — never the planning conversation.

- **Who:** a fresh subagent with the prompt. If the platform has no subagents, run the prompt yourself in a fresh pass after clearing working notes, and label the result `self-review (no subagent)` in the approval request.
- **Verdict:** `READY` or `NOT READY`. Findings carry Critical / Important / Minor (`../../agentic-sdlc/references/rules.md` §Status vocabulary and severity).
- **Fix loop:** fix every Critical and Important finding, re-run `plan-graph`, then send the revised plan to a fresh reviewer. At most 2 review rounds. A Critical finding still open after round 2 → stop, report `BLOCKED` with the finding, and route it by cause: spec defect → Specify stage (change protocol); architecture question → Architect; size → Analyst re-score.
- **Important findings** not fixed are listed as residual risks with the role that accepts them; Minor findings go to the plan's Risks table only when they affect Build.
- **Never** request Design sign-off with the verdict `NOT READY`.

## 4. Design sign-off readiness checklist

Every box must be true before the request. The request quotes the evidence of each line.

- [ ] Spec has a valid Specify sign-off: `spec-lint --check-approval specs/NNN-slug/spec.md` exit 0 (or the combined review covers both).
- [ ] `plan-graph specs/NNN-slug/plan.md --write` exit 0, no error lines; warnings explained (`ID_GAP` after a removal, `PATH_DEFAULT` fixed by adding the Path).
- [ ] `graph.json` regenerated by the last run and staged with the plan (`--check` would pass).
- [ ] Coverage matrix printed: every AC covered, every task's AC checked backward (§2).
- [ ] Self-review 12/12 (§1).
- [ ] Fresh-context plan review verdict `READY`, round count stated (§3).
- [ ] Every ADR in the header exists in status Proposed; or `none — <reason>`.
- [ ] Impact table complete; Regression scope command present; code map updated first when a path matched no module.
- [ ] `## Dependencies` filled or `none — <reason>`; each row inside the rule 10 bounds or covered by a waiver.
- [ ] Risks table lists every residual risk with an accepting role.
- [ ] Path still right: task count, file count, risk triggers match the spec score.
- [ ] Review count read from `plan-graph`: `review: combined` (Standard, ≤ 5 tasks) or `review: separate`.
- [ ] No secrets, credentials or real personal data in the plan, its fixtures or its examples (rule 7).

## 5. The request and the record

**Request** (one message, then end the turn — `../../agentic-sdlc/references/governance.md` §2):

```text
Tech Lead: Design sign-off for specs/NNN-slug/plan.md rev N (<separate | combined> review: <n> tasks).
- Built on spec rev R, hash <specHash> (<Specify sign-off row | presented in this same review>).
- plan-graph exit 0: <waves line>; <n> file conflicts resolved by waves; review: <combined|separate>.
- AC ↔ task coverage: <k>/<k> ACs covered, <n>/<n> tasks serve an AC; --no-red: <task or none>.
- Self-review 12/12. Plan review: <READY after r rounds | self-review (no subagent)>; <fixed findings>.
- Impact: <modules>; Regression scope: <command>.
- Dependencies: <none | packages>. ADRs: <list | none — reason>.
- Residual risks: <list, each with the accepting role>.

Approve plan rev N (hash <planHash>) as the Build baseline? Reply "yes" or list changes.
```

Before sending: append the register row in `specs/NNN-slug/approvals.md` (`Requested at`, UTC minute, asked role). A combined review adds the Product Owner's spec question to the same message and logs one register row per artifact.

**Record** (a later turn, explicit yes from the asked role only):

1. Append the row to `plan.md` `## Approvals` with the `planHash` printed by `plan-graph` and the spec hash printed by `spec-lint --hash`.
2. Fill `Answered at` and `Exact words` in `approvals.md`.
3. Move every ADR the plan lists from Proposed to Accepted.
4. Confirm the binding: `plan-graph specs/NNN-slug/plan.md --check --check-approval` exit 0.

| Reply | Decision |
|---|---|
| "yes", "approved", "yes, go ahead with plan rev 2" | `approved` |
| "yes, but keep Redis to one round trip" (a condition, nothing to change in the plan) | `approved with conditions`; the condition goes in Residual risks with an owner |
| "yes, but rename T3" / "approved after you split T4" | `rejected`: apply the change as rev N+1, re-run checks, request again |
| "looks fine", "sure", silence, an emoji, the Product Owner answering for the Tech Lead | Not an approval; ask again |

**Check codes after recording:** `APPROVAL_MISSING` (no approved row) · `APPROVAL_COLUMNS` (template columns missing) · `APPROVAL_VOID` (plan edited after approval) · `APPROVAL_SPEC_VOID` (spec edited after approval) · `APPROVAL_FIELD` (role, person or exact words empty) · `APPROVAL_REV` (approved rev ≠ latest Revision log rev) · `COMBINED_NOT_ALLOWED` (combined row on Full or with > 5 tasks). Each one blocks Build at `preflight`; fix by the change protocol, never by editing the hash.
