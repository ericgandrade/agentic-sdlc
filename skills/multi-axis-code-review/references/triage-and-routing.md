# Triage and Routing — Merge, Verify, Rate, Route, Record

Load in Steps 5–8 of `../SKILL.md`. Contract: `../../agentic-sdlc/references/review.md` §2–§4 and `../../agentic-sdlc/references/loops.md` §2, §7. This file adds the procedures, examples and formats; it changes no bound.

## 1. Merge

**Input:** every raw finding from every dispatched lens (L1 alone when stage 2 did not run), each `Ln-k · file:line-range · cause · statement · evidence · proposed: <sev>`.

Procedure:

1. Sort raw findings by file, then start line.
2. Widen each range by ± 3 lines. Two findings are candidates when the file matches and the widened ranges overlap.
3. Candidates merge only when the cause matches **and** fixing one fixes the other. Same lines, different defects (an injection and a memory issue on the same line) stay separate.
4. Merged row: highest proposed severity, every lens listed in order (`L3, L4`), the most specific evidence (a command with output beats a quoted line; a quoted line beats a description).
5. Collision log, one line each, under the Lenses table: `L3-1 + L4-2 → F-1 (export.ts:40-42, code)`.
6. Count check: raw findings = findings appearing in a merged row (directly or through the collision log). Unequal → merge incomplete → no verdict.

**Example.**

| Raw | File:lines | Cause | Statement |
|---|---|---|---|
| L3-1 | `export.ts:41` | code | filename from user filter → header injection (sec S10) |
| L4-2 | `export.ts:40-42` | code | CR/LF in `q` reaches `Content-Disposition` |
| L2-3 | `export.ts:44` | code | whole CSV built in memory |

L3-1 and L4-2 → F-1 (same defect). L2-3 overlaps after widening but is a different defect → F-2.

**Across rounds.** A finding raised again at the same location with the same claim on unchanged code keeps its old ID with the prefix `carried`; it is not re-verified. A finding on changed code is verified again.

## 2. Verify

Re-check every merged finding at the reviewed SHA before rating. Pick the cheapest method that settles it:

| Finding kind | Method that gives `confirmed` | Typical `not reproduced` |
|---|---|---|
| Behaviour claim ("throws when X", "returns 200 for another user") | One focused command: a single test, a `curl` against a local instance, a REPL call. Paste the command and its output | Command run; behaviour correct; output pasted |
| Missing handling (no guard for empty input) | Read past the hunk: callers, upstream validation, guards. Show the input reaches the line unguarded | An upstream guard rejects the input (cite the line) |
| Test does not prove the AC | Micro-mutation in a scratch worktree: invert the implementing condition, run only that test; a pass confirms | The test fails on the mutant |
| Rule violation (convention, ADR, checklist item) | The cited code line plus the written rule or item ID | The rule does not cover this case (quote it) |
| Spec mismatch | The AC text plus the line that contradicts it | The AC, read whole, allows the behaviour |
| Weakened bar | `git diff` hunk showing the before and after assertion or threshold, with no spec revision, ADR or waiver that explains it | The change traces to a Revision log entry or an ADR |

Rules:
- A finding is real only when the triggering condition can actually occur; an assertion on an unreachable state is defensive code, not a defect.
- Never decide one finding by its similarity to another; verify each at its own line.
- Keep severity out of verification: first decide if it is real, then how bad.
- Do not re-run the full suite; the Verification table already holds it. One command per specific doubt.
- `declined to judge` needs a reason outside the code: domain or product knowledge, production data or configuration, legal or regulatory judgement. "Too hard to check" is not a reason; try the cheapest method above first.

Each lens's **Declined to judge** list is processed here: an item the Reviewer can check becomes a normal finding (verified or not reproduced); the rest become findings with verification `declined to judge`, no severity, disposition `to human`, and a question in the Review guide. An empty list is recorded as `none`.

## 3. Rate

Definitions are in `../SKILL.md` Step 6. Calibration examples by axis:

| Axis | Critical | Important | Minor |
|---|---|---|---|
| Spec compliance | AC-3 403 path missing; AC test that passes with the AC removed | No negative test for the 50,000-row limit; mocked internal collaborator (A1/A5) | Test name lacks AC-n (A13) when the trace is otherwise clear |
| Correctness | Totals rounded wrongly; partial write on error leaves corrupt rows | Unbounded memory on a bounded input; swallowed error logged nowhere | — |
| Design and standards | `CONSTRAINTS.md` loosened without ADR and Design sign-off | ADR still `Proposed`; file outside the plan's Files; missing dependency note | Naming against an unwritten convention |
| Simplicity | — | Factory with one call site; feature logic in a shared module | Nested ternary; comment restating code |
| Security | S6 another user's ID accepted (shown by command); secret committed | S12 no rate limit on a new endpoint; S4 email in a log line | — |

Re-grade by effect: before finalizing, ask what a user of the software experiences when the defect fires. A lens that proposed Minor because "the spec did not say" is re-rated on that effect.

**Plan-mandated defects.** The plan told the Developer to build it this way, and the rubric calls it a defect → keep the rubric's severity, add `plan-mandated` to the Finding cell, set cause `plan`. The Tech Lead decides; neither the plan nor the Reviewer waives it.

**Pre-existing defects.** A defect present at the merge base that the diff neither touches, makes reachable nor worsens is not a finding of this change and gets no F-n: open an issue and list it in Review guide item 5 as `pre-existing #<issue>`; one that meets the Critical definition goes first in that list so the human reviewer sees it. A defect the diff makes reachable or worse is a normal finding of this change.

## 4. Route

Cause table: `../SKILL.md` Step 7 (same as `loops.md` §2). Decision questions, in order:

1. Can the finding be fixed without editing any approved AC, non-goal or constraint? No → `spec`.
2. Can it be fixed without changing a planned interface, ADR or architecture? No → `design`.
3. Can it be fixed inside the task's Files and order? No → `plan`.
4. Is the test (fixture, assertion, setup) the thing that is wrong? Yes → `test`.
5. Is it the environment (missing tool, service, flaky infrastructure)? Yes → `env`.
6. Otherwise → `code`. No evidence yet for any cause → `unknown` (Build, at most 1 round; a second `unknown` on one task is treated as `design`).

Doubt between `plan` and `code` → `plan`.

**Upstream routes** (`spec`, `design`, `plan`) trigger breaker B6 at once: the related sign-off is void, the Reviewer stops the round, and the escalation brief goes to the Product Owner (`spec`) or the Tech Lead (`design`, `plan`). The spec change follows the change protocol in `../../agentic-sdlc/references/rules.md`; a plan amendment is a new plan revision with a Revision log entry and a new Design sign-off. Before the upstream artifact is edited, list what already works and must survive (a KEEP list) in the escalation brief so the revision does not undo it.

**Cascade.** Every `code` or `test` finding in a file that an upstream finding names is held: disposition `held: F-n`. After the ruling, a held finding is re-verified against the new code; most disappear.

**Ruling record:**

```bash
node skills/agentic-sdlc/scripts/run-ledger.mjs ruling --run r1 --task PR --decision reroute \
  --by "Product Owner: L. Rocha" --note "F-1 AC-2/AC-5 conflict → spec rev 2"
```

Without Node: a row in `plan.md` `## Loop ledger` and the ruling line in the PR Findings Evidence cell.

## 5. Record

**Findings row** (one per F-n; `templates/pr-body.md` columns):

`| F-1 | L3, L4 | confirmed | Critical | server/src/routes/export.ts:40-42 | code | sec S10 — CR/LF in q injects headers | fixed f66b528 | Round 1: curl -i ".../export?q=a%0d%0aX:1" printed X: 1. Round 2: header absent |`

Allowed Disposition values: `fixed <sha>` · `rejected: <evidence>` · `deferred #<issue> (owner: "<exact words>")` · `closed` (not reproduced) · `to human` (declined to judge, rejected Critical awaiting ruling) · `held: F-n`. Empty → triage incomplete → NO-GO.

**Lenses row:** context (`fresh subagent`, `separate session`, `human`, `self-review`) · every check performed (from the lens's CHECKS PERFORMED, condensed but not dropped) · findings raised · `ran` or `lens not run: <reason>`.

**Summary line** under the Findings table: worst confirmed finding per axis, never one overall winner — `Spec: F-3 Important · Correctness: F-2 Important · Design: none · Simplicity: F-6 Minor · Security: F-1 Critical`.

**Rounds row:** `| 2 | e55a417..1b8d74a (scoped: 46 of 412 lines, 11%) | L1, L2, L3, L4 on the delta | F-1 resolved · F-2 resolved | none | GO |`

## 6. When to stop

- Round verdict GO → Test sign-off preparation.
- Round 3 ends with a Critical open → B4, Tech Lead, rulings `reroute` · `handover` · `drop`.
- The same failure signature (same F-n still applies) in two consecutive rounds → B2 anti-thrash, Architect, before the bound is reached; `run-ledger round` reports it when `--signature` is recorded consistently.
- Findings in a third round that are still real point upstream (a weak spec, unwritten conventions): say so in the escalation brief and name the artifact to fix, instead of another code round.
- Only Minor findings remain → they go to the deferred list; they never justify another round.
