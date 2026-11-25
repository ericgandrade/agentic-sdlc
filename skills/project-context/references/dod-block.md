# The `sdlc-dod` Definition of Done block

Load when writing, repairing or auditing the Definition of Done, when `preflight` or the CI check `agentic-sdlc/dod` reports a missing block or key, or when choosing commands for a stack. Contract: `../../agentic-sdlc/references/artifacts.md` §AGENTS.md block and `../../agentic-sdlc/references/verification.md` §1 (mechanism 3.3). This file adds the parser facts and stack examples; it never changes the five keys or the floor rule.

## 1. Who reads the block, and how

Four readers parse the same block. A block is correct only when all four accept it.

| Reader | Where it looks | What it parses | Runs | Fails when |
|---|---|---|---|---|
| `preflight` and `run-ledger start` (`../../agentic-sdlc/scripts/preflight.mjs`, `readDod` in `run-ledger.mjs`) | `AGENTS.md`, then `CLAUDE.md`, both at the repository root; the first file containing a block wins | The **first** fenced block whose info string is `sdlc-dod` (fence of ≥ 3 backticks or tildes, indented ≤ 3 spaces). Lines `key: value`; blank lines and lines starting with `#` skipped; the value is everything after the first colon | Every key except `coverage_min`, unless the value starts with `n/a`; through `/bin/sh` from the repository root; 30 min timeout per command (`--timeout`) | No block in either file → exit 2. A non-blank line without a colon → exit 2. A command exits non-zero → `baseline-dod` FAIL, exit 1. First program of a command not on `PATH` → `tools` FAIL |
| CI on GitHub (`../../agentic-sdlc/templates/ci/agentic-sdlc.yml`, job `agentic-sdlc/dod`) | The file in `DOD_FILE` (default `AGENTS.md`), **from the base branch** on pull requests | Lines between a line that is exactly ` ```sdlc-dod ` at column 0 (trailing spaces allowed) and the next line starting with ` ``` ` | Keys `lint`, `typecheck`, `test`, `coverage` in that order through `bash -c`; first occurrence of each key | Block absent → exit 2. Any of the four keys absent → exit 1. Command non-zero → red. `coverage_min` set and the coverage summary missing or below it → red |
| CI on GitLab (`../../agentic-sdlc/templates/ci/gitlab-ci.yml`, job `agentic-sdlc-dod`) | `DOD_FILE` from the merge request **target** branch | Same `awk` extraction as GitHub | Same four keys | Same rules |
| Humans and agents | The block in the instruction file | The same lines | The Developer before every completion claim; the Reviewer re-runs; the Release Engineer on the release commit (`verification.md` §1) | A missing row → claim withdrawn, status `BLOCKED` |

`dod-gate`† and the doctor† will read the same block once they ship (`../../agentic-sdlc/references/artifacts.md` §Later-release files).

## 2. Format rules that satisfy every reader

1. The opening fence is exactly ` ```sdlc-dod ` — three backticks, the word `sdlc-dod`, nothing else — at column 0. A four-backtick fence, a tilde fence, an indented fence or extra info words pass `preflight` but CI finds no block.
2. The closing fence is ` ``` ` at column 0.
3. The block lives in the instruction file named in `DOD_FILE`, and that file holds exactly one `sdlc-dod` fence. A second fence earlier in `AGENTS.md` (for example a documentation example) is the one `preflight` reads. Examples of the block in docs go inside an outer four-backtick `markdown` fence so neither parser matches them.
4. Five keys, one per line, at column 0, in this order: `lint`, `typecheck`, `test`, `coverage`, `coverage_min`. No duplicates: `preflight` keeps the last occurrence and CI the first, so a duplicate makes the two disagree.
5. No other keys. `preflight` runs any extra key; CI ignores it, so the check would bind locally and vanish in CI. Add an extra check to an existing key with `&&` (`lint: npm run lint && npm run check:deps`) — the route `../../agentic-sdlc/references/retrospective.md` names for automated retro actions.
6. A key with no tool in the project is written `<key>: n/a — <reason>`, lower-case `n/a` first. `preflight` matches `n/a` case-insensitively; the CI `case` statement matches only lower case.
7. `coverage_min` is a plain decimal number with at most one decimal (`71.3`), no `%`. `n/a — <reason>` is allowed only while the project has no coverage tool.
8. Every command is non-interactive, POSIX `sh` compatible (no `[[ ]]`, no `source`, no process substitution — CI uses `bash`, `preflight` uses `sh`), runs from the repository root, exits non-zero on failure and never starts a watcher (`vitest` defaults to watch mode outside CI: write `vitest run`).
9. Commands change nothing outside ignored build output: no `--fix`, no formatter writes, no `npm install`, no deploys. `preflight` requires a clean tree before it runs them, and the evidence fingerprint must be stable after them.
10. The `coverage` command writes the machine-readable summary the CI floor step reads (`COVERAGE_SUMMARY`, default `coverage/coverage-summary.json`, field `total.lines.pct`). Another format → adapt the floor step (§4) in the same change that installs CI.
11. The first word of each command is a program on `PATH` or a path inside the repository (leading `VAR=value` assignments are skipped). Shell builtins such as `test` and `cd` resolve.

## 3. Values

| Key | Must prove | Picking the command |
|---|---|---|
| `lint` | Style and static rules pass with zero errors | The linter CI already runs; check mode, never fix mode |
| `typecheck` | The code compiles or type-checks | `tsc --noEmit`, `mypy`, `go build ./...`, `dotnet build`, `mvn compile`; plain JavaScript → `n/a — plain JavaScript` |
| `test` | The test suite passes | The full suite when it finishes in ≤ 15 min; otherwise the fastest command covering the changed modules, with the full suite as a separate CI job recorded on the `Baseline:` line |
| `coverage` | Writes the coverage summary | May re-run the tests. Suites > 5 min: run coverage inside `test` and let `coverage` only check the summary exists (`coverage: test -s coverage/coverage-summary.json`), since CI runs the keys in order |
| `coverage_min` | The floor | Line coverage measured at adoption, rounded **down** to one decimal. Never lowered; a higher value measured at refresh or audit becomes the new floor |

Floor rules (`../../agentic-sdlc/references/rules.md` rule 9, `../../agentic-sdlc/references/tdd.md` rule 6): lowering `coverage_min`, deleting a key, or replacing a command with `n/a` or `true` to get green is an authority violation and a Critical review finding. A coverage value below the floor alone is Important and may take an `accept-risk` waiver for the PR at review. Preflight's `coverage-floor` check is not waivable: below the floor at the base it is a red baseline (report it, do not start), and on a resume mid-Build the coverage is raised before the next task with owner ≠ requester and expiry ≤ 30 days (`../../agentic-sdlc/references/governance.md` §6). Block edits take effect in CI only after merge, because CI reads the base branch; they need CODEOWNERS review (`AGENTS.md @tech-leads` in `../../agentic-sdlc/templates/CODEOWNERS`).

## 4. Stack examples

Each example is complete and passes all four readers. Replace the paths; keep the shape.

**Node + TypeScript (npm, Vitest)**

```sdlc-dod
lint: npm run lint
typecheck: npx tsc --noEmit
test: npx vitest run
coverage: npx vitest run --coverage --coverage.reporter=json-summary --coverage.reporter=text-summary
coverage_min: 78.4
```

Jest: `npx jest --coverage --coverageReporters=json-summary`. pnpm: replace `npx` with `pnpm exec`. Both write `coverage/coverage-summary.json`, so the CI floor step works unchanged.

Plain `node --test` (no test framework): pass files or a quoted glob, never a bare directory (`node --test test/` fails on Node 22: the directory is read as a file). `coverage: npx c8 --reporter=json-summary --reporter=text-summary node --test 'test/**/*.test.mjs'` writes the same file.

Node built-in runner without dependencies (Node ≥ 22): copy the script below to `scripts/coverage.mjs` and use `coverage: node scripts/coverage.mjs`. It runs the tests with the built-in coverage, writes lcov, and converts the line totals to `coverage/coverage-summary.json`.

```js
// scripts/coverage.mjs — node:test coverage → coverage/coverage-summary.json (json-summary shape)
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
mkdirSync('coverage', { recursive: true });
const r = spawnSync(process.execPath, ['--test', '--experimental-test-coverage', '--test-reporter=spec', '--test-reporter-destination=stdout',
  '--test-reporter=lcov', '--test-reporter-destination=coverage/lcov.info', 'test/**/*.test.mjs'], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);
const lcov = readFileSync('coverage/lcov.info', 'utf8');
const sum = (k) => [...lcov.matchAll(new RegExp(`^${k}:(\\d+)$`, 'gm'))].reduce((a, m) => a + Number(m[1]), 0);
const total = sum('LF'), covered = sum('LH'), pct = total ? Math.round((covered / total) * 10000) / 100 : 100;
writeFileSync('coverage/coverage-summary.json', JSON.stringify({ total: { lines: { total, covered, pct } } }) + '\n');
console.log(`lines ${pct}% (${covered}/${total})`);
```

Without Node ≥ 22 and without a dev dependency allowed, write `coverage: n/a — no coverage tool` and `coverage_min: n/a — no coverage tool` until one is added (rule 7).

**Python (uv, Ruff, mypy, pytest-cov)**

```sdlc-dod
lint: uv run ruff check .
typecheck: uv run mypy src
test: uv run pytest -q
coverage: uv run pytest -q --cov=src --cov-report=json:coverage/coverage.json
coverage_min: 64.0
```

Floor reader for CI: `COVERAGE_SUMMARY=coverage/coverage.json`, value `totals.percent_covered`. Plain virtualenv projects: `.venv/bin/pytest` (a path, so `preflight` checks that it exists).

**Go**

```sdlc-dod
lint: test -z "$(gofmt -l .)" && go vet ./...
typecheck: go build ./...
test: go test ./...
coverage: go test -coverprofile=coverage.out ./... && go tool cover -func=coverage.out | tail -n 1
coverage_min: 71.0
```

Floor reader: the last line of `go tool cover -func` (`total: (statements) 71.4%`). `golangci-lint run` replaces the lint command when the project already uses it.

**.NET**

```sdlc-dod
lint: dotnet format --verify-no-changes
typecheck: dotnet build --nologo -warnaserror
test: dotnet test --nologo --no-build
coverage: dotnet test --nologo --no-build --collect:"XPlat Code Coverage" --results-directory coverage
coverage_min: 66.5
```

Floor reader: the `line-rate` attribute of the root element in `coverage/*/coverage.cobertura.xml`, times 100. The colon inside `--collect:` is safe: both parsers split on the first colon only.

**Java (Maven, JaCoCo)**

```sdlc-dod
lint: mvn -B -q spotless:check
typecheck: mvn -B -q compile
test: mvn -B -q test
coverage: mvn -B -q verify jacoco:report
coverage_min: 70.2
```

Floor reader: `target/site/jacoco/jacoco.csv` (sum of `LINE_COVERED` ÷ (`LINE_COVERED` + `LINE_MISSED`)). Gradle: `./gradlew spotlessCheck`, `./gradlew compileJava`, `./gradlew test`, `./gradlew jacocoTestReport`.

**Bad block (each line breaks a reader)**

```text
  ```sdlc-dod                   ← indented: CI finds no block
Lint: npm run lint              ← capitalised key: CI reports "lint missing"
test: npm test -- --watch       ← watcher: preflight times out after 30 min
typecheck: N/A                  ← no reason; skipped by preflight, run as a command by CI
coverage_min: 78%               ← "%": the CI floor comparison fails
e2e: npx playwright test        ← extra key: runs in preflight, ignored in CI
```

## 5. Self-check before showing the block

Run from the repository root after writing the block to the working tree:

```bash
awk '/^```sdlc-dod[[:space:]]*$/{f=1;next} f&&/^```/{exit} f' AGENTS.md > .dod-check.txt
for k in lint typecheck test coverage coverage_min; do
  n=$(grep -c "^$k:" .dod-check.txt); [ "$n" = 1 ] || echo "key $k appears $n times"
done
grep -vE '^(lint|typecheck|test|coverage|coverage_min):|^#|^$' .dod-check.txt && echo "unexpected line above"
rm .dod-check.txt
```

No output means the CI parser accepts the block. Then run each command once and record exit code and duration. With Node ≥ 18 on a clean feature branch, `node .agentic-sdlc/bin/preflight.mjs` runs the same check end to end (`baseline-dod` row) and compares the floor (`coverage-floor` row): it reads `coverage/coverage-summary.json` `total.lines.pct`, the CI reader, and fails below `coverage_min`. Other summary formats (Go, .NET, JaCoCo, coverage.py) → `coverage-floor` SKIP; CI compares the floor.

## 6. Measuring and raising the floor

1. At adoption, run the `coverage` command on the baseline commit and read line coverage from the summary; write it rounded down to one decimal as `coverage_min` and on the `Baseline:` line.
2. At refresh, audit, or a retro action, re-measure on the default branch head. Higher by ≥ 0.1 → propose the new value as a one-line diff; never propose a lower one.
3. A coverage tool added later → measure first, then replace `coverage_min: n/a — …` with the measured value in the same PR that adds the tool.
