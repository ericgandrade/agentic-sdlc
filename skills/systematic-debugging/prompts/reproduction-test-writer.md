# Prompt — Independent Reproduction Test Writer

Used in Step 6 of `SKILL.md` for bugs where the Developer already suspects a fix: a fresh context writes the regression test from the symptom alone, so the test cannot be shaped around the intended fix. Dispatch as a subagent with only the inputs listed below.

**No subagents on the platform:** run this prompt yourself in a fresh pass after clearing working notes — start a section headed `--- Reproduction test pass ---`, load only the inputs below, write the test **before** re-reading the suspected code path or the hypothesis log, and label the result `self-review` in the task report.

## Inputs (and nothing else)

- The bug statement: reported symptom, expected behaviour, the `AC-n` or bug ID it violates (quote the AC text).
- The red loop command and its last output (redacted).
- The minimal case from Step 2 (input files, configuration).
- The public interface of the seam: signatures of the functions, endpoint or component the test may call, and the test file named in the task's `Files`.
- The project test conventions (framework, fixture helpers, naming rule from `../agentic-sdlc/references/tdd.md` §2).

Never pass: the hypothesis log, the suspected root cause, any proposed fix or diff.

## Prompt

```text
Role: Test author for one bug, working in a fresh context.

Write ONE automated test that reproduces the bug below and fails on the current code for the stated reason.

Bug: <BUG-n or AC-n> — <one-line symptom>
Expected: <expected behaviour, quoted from the AC or the issue>
Observed: <actual behaviour from the red loop output>
Red loop: <command> → <last 10 lines of output, redacted>
Minimal case: <inputs and configuration>
Seam: <signatures the test may call>; test file: <path>
Conventions: <framework, fixture helpers>

Rules:
1. Name the test "<BUG-n or AC-n> <observable behaviour>". One behaviour, at least one assertion on the value or state the expected behaviour names.
2. Call the code only through the seam given. Do not assert private calls, call order or internal fields.
3. Mock only process boundaries (network, clock, randomness, filesystem outside the test directory, third-party APIs).
4. No fixed sleeps; wait on conditions with a finite timeout.
5. Synthetic data only; no production records, tokens or names.
6. Run the test. It must FAIL, and the failure message must show the reported symptom. A syntax error, import error or setup crash is not a valid failure: fix the test and run again.
7. If no seam reaches the bug as it occurs (the bug needs a caller or chain the seam cannot drive), do not write a weaker test. Report "missing seam" with the call path you would need.

Return:
- Status: DONE | NEEDS_CONTEXT | CANNOT_VERIFY
- Test name, file path and the diff of the test file only
- Command run and the failing output (last 20 lines, redacted)
- One line: why this failure is the reported bug and not a neighbouring one
- "missing seam:" line when rule 7 applies
```

## After the pass

The Developer checks that the test fails for the expected reason (`../agentic-sdlc/references/tdd.md` §1 Step 1), records it with `run-ledger red`, then implements the fix without editing the test's assertions. Editing an assertion to make the fix pass is weakening a check (authority violation).
