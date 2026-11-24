# CONSTRAINTS.md — the quality bar agents cannot quietly lower

Load in constraints mode: a Full-path item starts without `CONSTRAINTS.md`, a user asks about the quality bar, agents keep weakening checks (suppressions, skipped tests, stubs), or a diff touches `CONSTRAINTS.md`. Contract: `../../agentic-sdlc/references/artifacts.md` §CONSTRAINTS.md (mechanism 14.4). Template: `../templates/CONSTRAINTS.md`.

## 1. When the file is required

| Path | CONSTRAINTS.md |
|---|---|
| Quick | Not required; the `sdlc-dod` block is the bar |
| Standard | Optional; recommended once the same weakening is seen twice (retro cause tag) |
| Full | Required before Design sign-off. The Architect reads it while planning; the Reviewer checks every diff against it (lens L2; security rows also under lens L3, `../../agentic-sdlc/references/review.md`) |

The file sits at the repository root, next to `AGENTS.md`, and is CODEOWNERS-protected (`CONSTRAINTS.md @tech-leads` in `../../agentic-sdlc/templates/CODEOWNERS`).

## 2. The four sections

**Floor (always enforced, never waived).** Rules that hold for every change regardless of path:

1. No new suppression comments (`@ts-ignore`, `@ts-expect-error` without a reason, `eslint-disable`, `# type: ignore`, `# noqa`, `//nolint`, `#pragma warning disable`, `@SuppressWarnings`).
2. No new skipped, focused or deleted tests without a reason line and a linked issue (`.skip`, `.only`, `xit`, `xdescribe`, `@pytest.mark.skip`, `t.Skip(`, `[Ignore]`, `@Disabled`).
3. No unimplemented stubs or empty error handlers in production code (`TODO: implement`, `NotImplementedError`, `throw new Error("not implemented")`, `panic("todo")`, `catch {}` / `except: pass`).
4. No secrets in source (`../../agentic-sdlc/references/security.md` §Secrets).
5. This file, the `sdlc-dod` block and CI checks are not weakened to make a change pass (`../../agentic-sdlc/references/rules.md` rule 9).

**Enforced with numbers.** One row per dimension: dimension · rule · exact command · runs at (task end, PR, nightly). A number without a command is an aspiration and does not go in this section.

**Ratchets.** Metric · today's value (date and SHA) · direction. The value moves only in the allowed direction; a better measurement replaces it.

**Exceptions.** Rule · path glob · reason · owner · expiry (≤ 30 days). The owner is not the requester (`../../agentic-sdlc/references/governance.md` §6). An expired exception is removed at the next audit; renewal is a new row with a new reason.

## 3. Procedure

1. **Detect.** Test runner and coverage output, linters and their rule sets, type checker, CI checks, security scanners (`../../agentic-sdlc/templates/ci/security.yml`: `secret-scan` with gitleaks, `dependency-audit` with osv-scanner), accessibility or performance tooling. Measure every current value before proposing any number.
2. **Ask the gaps**, at most four questions, each with a default so "not sure" still yields a working file:

   | Question | Default |
   |---|---|
   | Which dimensions beyond the floor? | Changed-line coverage + dependency security |
   | Block or warn when a check fails mid-task? | Block on the floor; warn on the rest for 14 days, then block |
   | Target numbers, or measure today and hold? | Measure today and hold (ratchet) |
   | Slowest acceptable check at task end? | 90 seconds; slower checks run in CI |

3. **Write** the file from the template; state each number with its reason.
4. **Include ≥ 1 external check** (vulnerability database, accessibility engine, real browser): a bar built only from the project's own tests is satisfied by code that does not work.
5. **Wire the floor guard** (§4) into the `lint` DoD key or a CI job, then prove it bites (§5).
6. **Show, approve, write** in a context PR (`../../agentic-sdlc/references/security.md` S20).

Defaults when the user has no opinion: changed-line coverage ≥ 80 %; project coverage never below `coverage_min`; 0 dependency advisories with CVSS ≥ 7.0; 0 secrets; 0 critical or serious accessibility violations on new UI (axe-core).

## 4. Floor-guard checks

A floor rule that only lives in prose is broken by the first agent under pressure. Each floor rule maps to a diff check that fails on added lines only, so existing debt does not block new work. Run against the merge base:

```bash
BASE=$(git merge-base HEAD "origin/${DEFAULT_BRANCH:-main}")
added() { git diff -U0 "$BASE"...HEAD -- "$@" | grep -E '^\+[^+]' ; }

# F1 suppressions
added '*.ts' '*.tsx' '*.js' '*.py' '*.go' '*.cs' '*.java' \
  | grep -nE '@ts-ignore|@ts-expect-error[[:space:]]*$|eslint-disable|type: ?ignore|noqa|//nolint|pragma warning disable|@SuppressWarnings' && exit 1
# F2 skipped or focused tests
added '*test*' '*spec*' \
  | grep -nE '\.(skip|only)\(|(^|[^[:alnum:]_])x(it|describe|test)\(|mark\.skip|t\.Skip\(|\[Ignore|@Disabled' && exit 1
# F3 stubs and empty handlers
added ':!*test*' ':!*spec*' \
  | grep -nE 'not implemented|NotImplementedError|panic\("todo|catch *(\([^)]*\))? *\{ *\}|except[^:]*: *pass' && exit 1
# F5 weakening the bar
git diff "$BASE"...HEAD -- AGENTS.md | grep -E '^-(lint|typecheck|test|coverage|coverage_min):' && exit 1
git diff --name-only "$BASE"...HEAD | grep -qx CONSTRAINTS.md && echo "CONSTRAINTS.md changed: ADR + Design sign-off required"
exit 0
```

F4 (secrets) is the `secret-scan` job; a local equivalent is `gitleaks git --redact --log-opts="$BASE..HEAD" .`.

Wiring options, cheapest first:

1. A script `scripts/floor-guard.sh` (in the project, not in `.agentic-sdlc/bin/`) appended to the lint key: `lint: npm run lint && sh scripts/floor-guard.sh`. Runs locally in `preflight` and in CI `agentic-sdlc/dod`.
2. Linter rules where they exist (ESLint `eslint-comments/no-use`, `@typescript-eslint/ban-ts-comment`, `jest/no-disabled-tests`, `jest/no-focused-tests`, Ruff `PGH003`, `PT` rules), which beat regexes on precision.
3. A separate required CI job, when the team prefers to keep the lint key pure.

A line that matches but is justified (a generated file, a documented upstream bug) goes into **Exceptions** with path, owner and expiry; the guard reads an allow-list of those paths. A guard edit that widens the allow-list is a loosening (§6).

## 5. Prove the gate bites

A check that has never been seen red is not a check. For each floor rule and each enforced number:

1. On a throwaway branch, add one violating line (`// @ts-ignore`, `it.only(`, a lowered `coverage_min`).
2. Run the guard or open a draft PR; record the red output.
3. Revert; record the green output.
4. Note both runs in the adoption ledger (`adoption-ledger.md`, Enforcement table). The CI side and branch-protection side of this proof belong to `deployment-pipeline` (`../../deployment-pipeline/references/prove-the-gate-bites.md`).

## 6. Changing the file

| Change | Route | Missing route |
|---|---|---|
| Tighten (higher number, new floor rule, new dimension) | Normal PR with CODEOWNERS review | — |
| Ratchet update to a better measured value | One-line PR citing the measurement | — |
| Add an exception | Row with owner ≠ requester and expiry ≤ 30 days | Exception without owner or expiry → Important finding |
| Loosen (lower number, remove a rule, widen an allow-list, remove a dimension) | ADR (`senior-solution-architect`) + Design sign-off | Critical finding; the change is reverted |

An agent that meets a failing constraint mid-task stops and reports `BLOCKED` with the check output; it never edits the file, the guard or the DoD block to get green.
