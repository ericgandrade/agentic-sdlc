# Weakened-Bar Guard

Load in Step 0.6 (full diff) and Step 9.5 (every fix delta) of `../SKILL.md`. Rule 9 of `../../agentic-sdlc/references/rules.md`: never weaken a test, threshold or check to get green. `../../agentic-sdlc/references/tdd.md` §1 rule 6 calls it an authority violation; in unattended mode it is halt reason `authority` (`../../agentic-sdlc/references/autonomous.md`).

The scan finds candidates; L1 (test files) and L2 (thresholds, suppressions, CI) judge them; the Reviewer verifies them like any finding. The scan never produces a verdict by itself.

## Scan

Run from the repository root with the pinned base (Step 0). POSIX shell and git; on Windows use Git Bash. Without a shell, read the diff for the same patterns.

```bash
BASE=$(git merge-base origin/main HEAD)        # use the PR target branch
RANGE="$BASE...HEAD"                            # fix delta in Step 9: "<reviewed-sha>..HEAD"

# W1 skips and focus markers added
git diff -U0 $RANGE | grep -E '^\+' | grep -E \
 '\.(skip|only)\(|\bx(it|describe|test)\(|@(Disabled|Ignore)\b|pytest\.mark\.(skip|xfail)|unittest\.skip|t\.Skip\(|#\[ignore\]'

# W2 assertions removed vs added in test files (removed > added is a candidate)
git diff $RANGE -- '*test*' '*spec*' | grep -cE '^-[^-].*\b(expect|assert)'
git diff $RANGE -- '*test*' '*spec*' | grep -cE '^\+[^+].*\b(expect|assert)'

# W3 loosened matchers added
git diff -U0 $RANGE -- '*test*' '*spec*' | grep -E '^\+' | grep -E \
 'toBeDefined|toBeTruthy|toBeGreaterThan\(0\)|objectContaining|expect\.any\(|assert True\b|assertIsNotNone|is not None\)'

# W4 tolerance, timeout and retry changes
git diff -U0 $RANGE | grep -E '^[-+]' | grep -iE 'timeout|retries|retry|tolerance|epsilon|toBeCloseTo|approx|rel_tol|flaky'

# W5 suppressions added
git diff -U0 $RANGE | grep -E '^\+' | grep -E \
 'eslint-disable|@ts-ignore|@ts-expect-error|# noqa|# type: ignore|nolint|@SuppressWarnings|#\[allow\(|pragma: no cover|istanbul ignore|c8 ignore'

# W6 bar files touched
git diff --stat $RANGE -- AGENTS.md CLAUDE.md CONSTRAINTS.md '.github/workflows/*' '.gitlab-ci.yml' \
 '*jest.config*' '*vitest.config*' '.nycrc*' 'codecov.yml' 'pyproject.toml' 'setup.cfg' '.coveragerc' \
 '*eslint*' '.gitleaks.toml' '.snyk' 'CODEOWNERS' 'specs/*/acceptance-tests.md'

# W7 deleted tests and changed snapshots
git diff --name-status $RANGE | grep -E '^D.*(test|spec)'
git diff --stat $RANGE -- '*.snap' '*__snapshots__*'
```

Read every W6 hit in full: `coverage_min` in the `sdlc-dod` block, `coverageThreshold`, `fail_under`, `continue-on-error: true`, `allow_failure: true`, `|| true`, a removed job or step, a new allowlist entry, an `--ignore-vuln` or `audit-level` change.

Also check by reading (no reliable pattern):
- **W8** expected values changed in a test whose implementation changed in the same diff while no AC changed.
- **W9** `acceptance-tests.md` or acceptance test files changed in a Developer commit (the Test Engineer owns them; `../../agentic-sdlc/agents/test-engineer.md`).
- **W10** a test rewritten to mock what it previously exercised for real (A1, A5).

## Legitimacy test

A candidate is **not** a finding only when one of these is shown, cited in the Evidence cell:

| Change | Legitimate when |
|---|---|
| AC test assertion or expected value changed | A spec revision changed that AC: Revision log entry, new Specify sign-off at the new hash |
| Threshold, rule or `CONSTRAINTS.md` loosened | An ADR plus a Design sign-off that names the change |
| DoD gap accepted (coverage 77.9 < 78.4) | A waiver row (`accept-risk` or `defer`, owner ≠ requester, expiry ≤ 30 days, follow-up issue). The waiver accepts the gap; the threshold in the file stays unchanged |
| Test deleted | The code it tested is deleted too, and the AC is removed by a spec revision or covered by a named replacement test |
| Suppression added | One-line reason on the same line naming the false positive, and the rule is not a security rule |
| Snapshot updated | The snapshot change is the AC's visible output and ≤ 30 lines, read and explained (A11) |
| Timeout raised | A measured reason (CI timing output) and no fixed sleep added (A3) |

"The test was flaky" is never legitimate for a skip: the flake is a bug to fix (A3, A4) or an issue with the test still running.

## Severity

| Severity | Weakening |
|---|---|
| **Critical** | A test that proves an AC (named `AC-n` or listed in `acceptance-tests.md`) can no longer fail for that AC · a lowered or removed DoD key, CI required check or threshold that hides a red result under the approved bar · `CONSTRAINTS.md` loosened without ADR and Design sign-off · secret scan or dependency audit disabled or allowlisted without a waiver (S1, S16) · acceptance tests edited by the Developer to match the implementation |
| **Important** | A new skip or focus marker on a test that proves no AC (A12) · a suppression without a reason · a raised timeout or retry count in tests · snapshot sprawl (A11) · a deleted test with no replacement for unchanged code |

A weakened check is never Minor. Cause: `test` for test files and acceptance tests; `code` for configuration and threshold files. The fix is to revert the weakening; a real gap then goes through the legitimate route above.

## Example

Round 2 delta of PR #61 (W3 and W6 hits):

```diff
-  expect(rows).toHaveLength(50000);          // AT-4b, AC-4
+  expect(rows.length).toBeGreaterThan(0);
...
-coverage_min: 78.4
+coverage_min: 75
```

- F-9 · L1 · confirmed · Critical · `tests/export.test.ts:88` · test · AT-4b no longer fails when the 50,000-row limit is broken · evidence: hunk above; no spec revision for AC-4.
- F-10 · L2 · confirmed · Critical · `AGENTS.md:31` · code · `coverage_min` lowered 78.4 → 75; measured 76.2 is red under the approved floor · evidence: hunk above; `DoD:coverage` output; no waiver.

Disposition path: revert both; if coverage really stays below 78.4, the Tech Lead may grant an `accept-risk` waiver for the gap with an owner and expiry.
