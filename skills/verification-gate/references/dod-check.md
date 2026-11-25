# Definition of Done Check

Load at Step 2. The Definition of Done is the project-wide bar in the `sdlc-dod` fenced block of `AGENTS.md` (format: `../../agentic-sdlc/references/artifacts.md` §AGENTS.md block). Acceptance criteria are the per-item bar in `spec.md` or the issue. Both must hold; neither substitutes for the other. When `scripts/dod-gate.mjs` exists in the installed agentic-sdlc version, it replaces §3 and its exit code is the result; until then run this procedure by hand.

## 1. Locate and read the block

1. Search `AGENTS.md` at the repository root, then `CLAUDE.md`, for a fence whose info string is exactly `sdlc-dod`. The first match wins (the same order the agentic-sdlc scripts use).
2. No block in either file → `NEEDS_CONTEXT: sdlc-dod block missing`. Route to `project-context` to write it. Never fall back to guessed commands such as `npm test`; an invented DoD is not the project's DoD.
3. Parse one `key: value` per line. Expected shape:

````markdown
```sdlc-dod
lint: npm run lint
typecheck: npm run typecheck
test: npm test
coverage: npm run coverage -- --json-summary
coverage_min: 78.4
```
````

## 2. Validate the block

| Check | Valid | Invalid → result |
|---|---|---|
| Keys | exactly `lint`, `typecheck`, `test`, `coverage`, `coverage_min` | a missing key → `BLOCKED: DoD key <k> missing`; an unknown key → ignored by the gate, noted as Minor |
| Values | a command, or `n/a — <reason>` | empty, `TODO`, `tbd`, or `n/a` without a reason → `BLOCKED: DoD key <k> has no command or reason` |
| `coverage_min` | a number (`78.4`) or `n/a — <reason>` when `coverage` is `n/a` | non-numeric → `BLOCKED` |
| Ratchet | `coverage_min` on the PR head ≥ the value on the base branch (`git show <base>:AGENTS.md`) | lower → authority violation (below) |
| Commands unchanged | each DoD command on the head equals the base, or the change is stricter | weaker → authority violation (below) |
| `test` key | never `n/a`; a project with no tests records the reason and the Reviewer raises it on lens L2 | — |

`n/a` reasons that hold: `typecheck: n/a — plain JavaScript project, no type checker`; `coverage: n/a — shell scripts, no coverage tool for bash`. Reasons that do not: `n/a — slow`, `n/a — flaky`, `n/a — later`.

### Weakened bar (authority violation)

The diff is compared against the base for these moves; any one invalidates the affected DoD rows:

| Move | Example in the diff |
|---|---|
| floor lowered | `coverage_min: 78.4` → `coverage_min: 75` |
| failure swallowed | `test: npm test || true`, `; exit 0` |
| empty suite accepted | `--passWithNoTests`, `--no-tests=pass` |
| scope narrowed | `lint: eslint src/` → `lint: eslint src/api/` |
| rule disabled | new `eslint-disable`, `# noqa`, `@ts-expect-error`, `// nolint` in changed files without a reason line |
| test skipped | new `.skip`, `xit`, `@Ignore`, `@pytest.mark.skip`, `t.Skip()` |
| coverage excluded | new paths in the coverage `exclude` config |

Treatment: the rows do not count; raise a Critical finding with cause `code` and the diff line as evidence (`../../agentic-sdlc/references/tdd.md` §1 rule 6 names it an authority violation; unattended runs halt with reason `authority`). The only legitimate route is a waiver with an owner other than the requester, a reason, an expiry ≤ 30 days and a follow-up issue (`../../agentic-sdlc/references/governance.md` §6). A higher measured coverage raises the floor: the next `project-context` update writes the new value.

## 3. Run the DoD

For every key except `coverage_min`, run the command exactly as written, on the current fingerprint, following `fresh-run-protocol.md`. Record:

| Key | Row ID | `Exit` cell |
|---|---|---|
| lint | `DoD:lint` | shell exit code |
| typecheck | `DoD:typecheck` | shell exit code, or `n/a — <reason>` copied from the block |
| test | `DoD:test` | shell exit code; output must show ≥ 1 test executed |
| coverage | `DoD:coverage` | `<shell exit> (<measured> ≥ <coverage_min>)`; below the floor write `<shell exit> (<measured> < <coverage_min>) — below floor`, a failed row even when the tool exited 0 |

Reading the coverage value: take it from the tool's summary line or JSON summary (for example `coverage/coverage-summary.json` → `total.lines.pct`, or the `All files` row). Use the metric the project's `coverage_min` was measured with at adoption; when unknown, use lines and note the choice in the row. A coverage command that exits 0 but never compares against the floor still needs the comparison written in the cell; generating a report is not enforcing the number.

`preflight` (`node skills/agentic-sdlc/scripts/preflight.mjs`) runs the same commands as `baseline-dod` at the start of a Build run. Its result is a baseline on the start fingerprint; it never counts as a DoD row for a later claim.

## 4. Separate the DoD from the ACs

| Situation | Verdict |
|---|---|
| DoD green, an AC row missing | not done: the AC is unproven |
| AC rows green, `DoD:lint` red | not done: the bar is not met |
| DoD green on fingerprint A, AC rows green on fingerprint B | not done: one set is stale; re-run both on the current fingerprint |
| `DoD:test` includes the acceptance tests | still write the AC rows separately, with commands that select each AC's tests, so each AC has its own evidence |
| A red DoD row caused by a pre-existing failure on the base branch | `BLOCKED`; show the same failure at the base (run the command in a separate worktree at the base SHA) and raise it to the human; the bar is not waived silently |

## 5. Mini-example

Block on the head: `coverage_min: 78.4`; on the base: `coverage_min: 78.4`. Commands unchanged. Runs on fingerprint `b7e2a91c04d5`:

| ID | Command | Exit |
|---|---|---|
| DoD:lint | `npm run lint` | 0 |
| DoD:typecheck | `npm run typecheck` | 0 |
| DoD:test | `npm test` | 0 |
| DoD:coverage | `npm run coverage -- --json-summary` | 0 (84.1 ≥ 78.4) |

The `DoD:test` excerpt shows `Tests 96 passed (96)`, so the run executed tests. DoD satisfied. The four AC rows are still required before any completion claim.
