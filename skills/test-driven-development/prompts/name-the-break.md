# Prompt: Name the Break (mutation proposal)

Used in SKILL.md Step 5, after green and before commit. Dispatch to a **fresh subagent** that has not seen the implementation reasoning. It reads code and proposes mutants; it never edits files. The Developer applies each mutant, runs the test, records the result and reverts.

**No subagents on the platform:** clear working notes, start a pass labelled `--- name-the-break pass ---`, read only the inputs listed below, and follow the same instructions. Mark the result `self-review` in the task report.

## Inputs to pass

- The task's AC text (IDs and Given/When/Then lines) — not the plan's reasoning.
- The new or changed test file(s), full content.
- The production files the task touched, full content, with line numbers.
- The single-test command for the project.

## Prompt template

```text
Role: mutation reviewer for one Build task in the Agentic SDLC. Read-only.

Goal: for each test listed below, propose realistic production-code mutants that the test
should catch. A mutant is a small edit a real developer could make by mistake. Do not edit
any file. Do not suggest test changes until the table is complete.

Acceptance criteria:
<paste AC-n lines>

Tests (file and names):
<paste test file>

Production code (with line numbers):
<paste touched files>

Single-test command: <command with name filter placeholder>

Procedure:
1. For each test, state in one line the behaviour it claims to prove and its "break": the
   production change that should make it fail. If no break can be named, mark the test
   NO-BREAK and explain why (asserts nothing observable, or only an intentional decision).
2. Propose 1 to 5 mutants per test, drawn from these classes, highest bug likelihood first:
   - constant: wrong literal, limit, rate or argument (50000 → 500000, "EUR" → "USD")
   - branch: wrong comparison or operator, inverted condition, wrong handler (> → >=, && → ||)
   - effect: missing state change or side effect (drop the save, the event, the header write)
   - default: empty or default return (return [], return null, return 0)
   - validation: missing guard for zero, empty, null, unauthorized or malformed input
3. Each mutant must change behaviour on a line the task touched or a line its tests reach.
   Skip equivalent mutants (no observable difference) and say so.
4. Predict for each mutant: which assertion should fail and with what message.
5. Flag any test that no proposed mutant would fail as SURVIVOR-RISK, with the missing
   assertion that would kill it (literal value, boundary case, effect check).

Output exactly this table, then the flags:

| Test | Break (one line) | Mutant ID | file:line → change | Class | Expected failing assertion |
|---|---|---|---|---|---|

Flags:
- NO-BREAK: <test> — <reason>
- SURVIVOR-RISK: <test> — <assertion to add>

Return status: DONE (table complete) or NEEDS_CONTEXT (a file or AC is missing; name it).
```

## Developer procedure with the result

For each mutant row, in order:

1. Apply the change exactly as written.
2. Run the single-test command for that test. Expected: FAIL.
3. Revert the change. Run the test again: PASS. Run `git diff` — only intended task changes remain.
4. Record `killed` (failed as predicted), `killed-other` (failed on a different assertion; note it) or `survived`.

Then:

| Outcome | Action |
|---|---|
| Every test has ≥ 1 killed mutant | Paste the table into the task report; continue to Step 7 |
| A mutant survived | Keep the mutant applied; strengthen the test or add a boundary test; run it first against the mutant (FAIL is its red: paste it, and record `run-ledger red` for a new test); revert the mutant; run again (PASS) |
| Same mutant survives after one strengthening | List it under Concerns; status `DONE_WITH_CONCERNS` |
| NO-BREAK test | Delete it or rewrite it around an observable behaviour; a rewritten test goes back through Red |
| A test has 0 killed mutants | Delete or rewrite; it cannot fail on a realistic bug |

Bounds: at most 5 mutants per test and 15 per task; mutation work does not count as red-green rounds, and it never changes production behaviour that reaches the commit.

## Example output (abridged)

| Test | Break (one line) | Mutant ID | file:line → change | Class | Expected failing assertion |
|---|---|---|---|---|---|
| AC-4 more than 50,000 rows returns 422 ROW_LIMIT | dropping the row cap returns 200 | M1 | `src/report/export.ts:41` `> 50000` → `> 500000` | constant | `expected 422, got 200` |
| AC-4 more than 50,000 rows returns 422 ROW_LIMIT | dropping the row cap returns 200 | M2 | `src/report/export.ts:41` `>` → `>=` | branch | none — test uses 50,001; SURVIVOR-RISK |
| BUG-418 empty filter returns the header row | header written after the empty guard | M3 | `src/report/export.ts:37` move `writeHeader()` below the guard | effect | `expected 'order_id,customer,total', received ''` |

Flags:
- SURVIVOR-RISK: AC-4 — add `AC-4 exactly 50,000 rows is accepted` to pin the boundary.
