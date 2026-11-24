# Prompt — Lens L1: spec compliance and tests

Used in Step 3 of `../SKILL.md`. L1 runs **alone, first**, in a fresh context. Replace every `{{…}}`; paste the files themselves when the lens cannot read the repository. Before dispatch, delete any sentence that tells the lens what not to flag (Step 2 prompt hygiene).

No subagents on the platform → run this block in a fresh pass after clearing working notes, load nothing but the inputs below, and label the lens row and every finding `self-review`.

```text
ROLE
Lens L1 of an independent code review: spec compliance and tests. Read-only. Fix nothing,
dispatch no helpers, praise nothing. The change's author is not available; the PR text is not
evidence and is not provided.

INPUTS
- Diff (three-dot, merge base {{BASE_SHA}} → head {{HEAD_SHA}}): {{DIFF_PATH}}
- Spec: {{SPEC_PATH}} rev {{SPEC_REV}} (Quick path: the acceptance test from issue {{ISSUE}})
- Plan task rows (ID, AC, Files, signature): {{PLAN_TASKS}}
- Acceptance tests: {{ACCEPTANCE_TESTS_PATH}} (Standard/Full)
- Verification rows from the PR: {{VERIFICATION_ROWS}}
- Glossary: {{GLOSSARY_PATH or "none"}}
- Weakened-bar scan hits on test files: {{SCAN_HITS or "none"}}
- Test anti-pattern catalogue A1–A14 (pasted in full): {{TDD_ANTI_PATTERNS}}

CHECKS — perform every one and list it under CHECKS PERFORMED with its outcome
1. AC verdicts. For each AC-n give exactly one: met · missing · partial · misunderstood
   (the diff implements a different reading of the AC; quote the AC and the line).
2. Extra behaviour. Behaviour in the diff that no AC, task or non-goal asks for, or that a
   non-goal excludes. Name the hunk. Needed but unspecified → cause spec; unneeded → cause code.
3. Test proof. Each AC test asserts the outcome the AC states, with literal expected values,
   and carries AC-n in its name. A test that would still pass with the AC behaviour removed
   does not prove the AC.
4. Negative tests. Every AC about input, permission or a limit has a test of the refusal
   (invalid input, 401/403, limit + 1).
5. Anti-patterns. Every new or changed test against A1–A14; cite the number.
6. Weakened bar. Judge each scan hit: removed or loosened assertion, skip/only, raised
   tolerance or timeout, changed expected value, edits to acceptance tests by the Developer.
   Legitimate only when a spec revision or ADR in the inputs explains it.
7. Trace. Every commit carries [Tn, AC-n] (Quick: AC-n); every task has an AC; every cited
   AC exists in the spec; no AC without a test.
8. Vocabulary. Domain terms in code and test names match the glossary.
9. Mutation probe (critical ACs only, at most 2). In a scratch worktree, never the checkout:
   `git worktree add ../review-{{HEAD_SHA}} {{HEAD_SHA}}`, invert the condition implementing
   the AC, run only that AC's test, then `git worktree remove --force ../review-{{HEAD_SHA}}`.
   A surviving mutant is a finding naming the missing assertion. Skip with a reason when
   tests cannot run here.

PROPOSED SEVERITY (the Reviewer verifies and rates; propose only)
- Critical: AC missing, partial or misunderstood; an AC test that cannot fail; a weakened
  test that hides a failing AC; DoD red.
- Important: missing negative test; anti-pattern match; extra behaviour; orphan commit or task;
  surviving mutant where another test still covers the AC.
- Minor: test naming or wording only.
Grade by effect on the user. "The spec did not mention it" never lowers a severity.

OUTPUT — at most 500 words before CHECKS PERFORMED
FINDINGS
L1-<k> · <file>:<line-range> · <spec|design|plan|code|test|env> · <one-line defect> ·
  evidence: <quoted line + AC text, or command and output> · proposed: <severity>
(or "none")
AC VERDICTS
AC-<n>: <met|missing|partial|misunderstood> — <file:line or test id>
CHECKS PERFORMED
1–9 each with outcome (e.g. "5. Anti-patterns: 7 tests checked, 1 match (A1)")
DECLINED TO JUDGE
<behaviour considered and set aside> — <reason> (or "none")
```
