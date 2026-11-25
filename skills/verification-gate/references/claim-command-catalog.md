# Claim → Command Catalog

Load at Step 1 (which rows a claim needs) and Step 7 (claims check). Each claim type names the command that proves it, what to read in the output, and what does **not** count. Commands are examples for common stacks; the real command comes from the `sdlc-dod` block, `acceptance-tests.md`, or the project's checked-in scripts (`package.json` scripts, `Makefile`, `./gradlew`, `pyproject.toml`, CI workflow files). Never assume `npm test` without reading the project.

Every row produced from this catalog follows the Verification format in `../../agentic-sdlc/templates/pr-body.md` and the fingerprint rule in `../../agentic-sdlc/references/verification.md` §4.

## 1. Catalog

| Claim | Proving command (example) | Read in the output | Does NOT count |
|---|---|---|---|
| **Tests pass** | the `sdlc-dod` `test` command, full suite (`npm test`, `pytest`, `go test ./...`, `./gradlew test`) | executed count ≥ 1; `0 failed`; skipped count unchanged from the base or explained | a focused file; a run on another fingerprint; "should pass"; a run where the summary line is missing (crash before report) |
| **Lint clean** | `sdlc-dod` `lint` | `0 errors`; new warnings listed for lens L2 | an editor showing no squiggles; a lint run restricted to changed files when the DoD command lints the project |
| **Types check** | `sdlc-dod` `typecheck` (`tsc --noEmit`, `mypy`, `pyright`) | `0 errors`; no new `@ts-ignore`, `# type: ignore`, `any` casts in the diff | a successful build in a bundler that strips types; an IDE without errors |
| **Builds** | the project build (`npm run build`, `cargo build --locked`, `mvn -q package -DskipTests`) | exit 0; artefact path printed or present | lint or typecheck passing; a dev server that started |
| **Coverage at floor** | `sdlc-dod` `coverage` | measured value (lines or the metric the project uses) ≥ `coverage_min`; written `0 (82.3 ≥ 78.4)` | a report generated without the threshold being compared; a value from another fingerprint |
| **AC-n met** | the AC's command from `acceptance-tests.md` (`npx vitest run <file> -t "AC-4"`, `pytest -k AC_4`, `npx playwright test --grep "AC-4"`) | every test ID mapped to AC-n appears and passes; the assertion matches the AC wording, number and unit | a DoD row; a test that asserts only part of the outcome; a test written after reading the implementation instead of the spec; a skipped or filtered test |
| **Bug fixed** | the regression test named `AC-n …` (Quick: the issue's acceptance test) run at the commit **before** the fix (red, original symptom) and on the current fingerprint (green) | red output shows the reported symptom (status, message, wrong value); green output passes the same test | the fix commit existing; "cannot reproduce anymore" without the red run; a test that never failed |
| **Regression test works** | red-green proof: test passes → revert only the fix (`git stash push <file>` or a scratch worktree at the parent commit) → test must fail → restore → test passes | the failure in the reverted state is the expected assertion, not a compile error | a test that passes in both states; a revert that also removed the test |
| **No regressions** | full `sdlc-dod` `test` + every acceptance test + `coverage`, on the current fingerprint after the last merge from the base branch | same or higher executed count than the base; 0 failed; no newly skipped tests | the AC tests alone; a CI run on an older head; "nothing else uses that function" without a search |
| **Performance within budget** | the measurement the AC states (load tool, benchmark harness, profiler) with sample size, warm-up and environment written in the row | the AC's statistic in the AC's unit (`p95 = 241 ms over 200 requests, budget 300 ms`) | a single run; a mean when the AC says p95; a laptop number when the AC names an environment; a measurement that cannot run before merge → `CANNOT_VERIFY` with reason |
| **Limit enforced** (rows, size, rate) | tests at the limit and limit + 1 (`50,000` passes, `50,001` rejects) | both boundary tests present and passing; the rejection shape matches the AC (status code, no partial output) | a test only far above the limit; a test only at the happy size |
| **Permission enforced** | a negative test with a principal lacking the permission | denial status and no side effect (no file, no write, no log of the payload) | a positive test with an admin; code inspection |
| **Security issue fixed** | the exploit or misuse case as a test (injection payload, missing authz, path traversal) | the payload is rejected or neutralised; the specific checklist item ID (`sec S10`) in the row | a scanner reporting 0 findings when the scanner never covered that class; "input is sanitised" without a test |
| **Migration safe** | apply and roll back on a disposable copy (`migrate up`, `migrate down`, `migrate up`) plus a data check query | each step exit 0; row counts or checksums before and after match the expected values | migration files that look correct; a run on an empty database when the AC concerns existing data |
| **Docs updated** | the docs build and link check (`npm run docs:build && npm run docs:links`) | exit 0; the changed pages listed in the `Docs` row | a README edit without a build; `n/a` without "no user-visible change" |
| **UI state correct** | the end-to-end test mapped to the AC or to the `UX-n` row of `ux.md` | the state assertion (text, role, disabled state) passes; screenshots attached when the template asks | a screenshot without a fingerprint; a human-only check not recorded as a UX Designer check `UX-n` |
| **Flaky test fixed** | the test run 20 times in a row (`--repeat 20`, `pytest --count 20`, a shell loop) | 20 of 20 passing; the cause named (clock, order, shared state) | one green run; a retry flag added to the test config |
| **Subagent or agent finished** | `git log --oneline <base>..HEAD` and `git diff --stat <base>..HEAD`, then the rows above for whatever the report claims | the commits and files exist and match the task's `Files` list | the report's `DONE` line; a summary of changes; a ledger entry |
| **Dependency approved** | the Design sign-off note in `plan.md` plus the lockfile diff | name, license, version pinned, advisory check output, lockfile committed | the dependency being popular; a passing build |
| **Release ready** | every row above on the release commit's fingerprint plus the rollback rehearsal output (`../../agentic-sdlc/references/release-ops.md`) | rehearsal exit 0 and the recovery check | the PR having been approved; staging looking fine |

## 2. Never evidence, for any claim

- Output from another fingerprint, another branch or another machine's working tree.
- Output typed, summarised or reformatted by an agent instead of copied.
- A PR description, a commit message, a code comment, a ledger line or an agent report. These are testimony.
- A test command that exited 0 with 0 tests executed (an empty filter, a wrong path, a collection error swallowed by the runner).
- A skipped, disabled, quarantined, `.only`-excluded or filtered test counted as passing.
- A green CI badge without the SHA it ran on, compared with the PR head.
- A check whose command was edited in the same diff to be less strict.
- "It worked when I tried it manually" without the command and output.

## 3. Wording rules for the claim itself

| Instead of | Write |
|---|---|
| "All tests pass" | "`npm test`: 214 passed, 0 failed, 3 skipped (unchanged from base) · fingerprint `3f0c9e21b7a4`" |
| "Fixed" | "AC-1 regression test red at `9e1d4c2` (500), green at fingerprint `3f0c9e21b7a4`" |
| "Fast enough" | "p95 241 ms over 200 requests on the staging profile, budget 300 ms (AC-6)" |
| "Should work" | the status `CANNOT_VERIFY` with reason, verifier and date, or the command that settles it |
| "No regressions" | "full suite 214/214 and 12/12 acceptance tests on fingerprint `3f0c9e21b7a4`, after merging `main` at `c02d771`" |

A sentence that cannot be rewritten into the right-hand form is not ready to be said.
