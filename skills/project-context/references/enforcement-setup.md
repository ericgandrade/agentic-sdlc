# Enforcement setup — what the context hands to CI

Load in enforce mode: week 3 of the rollout (`../../agentic-sdlc/references/adoption.md` §2), when the platform probe reports `enforcement: prompt-only` or `ci: none`, when the Release Engineer or Tech Lead asks which CI values to use, and when an `Enforcement:` line has to change. Contracts: `../../agentic-sdlc/references/governance.md` §7 (controls), `../../agentic-sdlc/references/platforms.md` §1 (probe) and §3 rows 5–7 (degradation), `../../agentic-sdlc/references/security.md` S17 and S20 (mechanism 10.5).

**Boundary.** This skill prepares the inputs, records the state and keeps the block honest. Installing workflow files, configuring branch protection, CODEOWNERS enforcement and environment reviewers, and proving each gate bites belong to `deployment-pipeline` (`../../deployment-pipeline/references/branch-protection.md`, `../../deployment-pipeline/references/prove-the-gate-bites.md`). Never claim a control is active because a file exists.

## 1. Values the CI templates need from the context

| Template variable | Template | Value from the context |
|---|---|---|
| `DOD_FILE` | `../../agentic-sdlc/templates/ci/agentic-sdlc.yml`, `../../agentic-sdlc/templates/ci/gitlab-ci.yml` | The file that holds the block: `AGENTS.md`, or `CLAUDE.md` when the project refused `AGENTS.md` |
| `SDLC_BIN` | Both | `.agentic-sdlc/bin` when vendored (`vendoring.md`); otherwise a pinned checkout path |
| `COVERAGE_SUMMARY` | Both | The path the `coverage` key writes (`dod-block.md` §4); a non-Istanbul format also needs the floor step adapted |
| Default branch (`branches: [main]`) | GitHub template | `git symbolic-ref --short refs/remotes/origin/HEAD` minus `origin/` |
| Dependency install step | Both | The install command found in Step 1 discovery (`npm ci`, `uv sync --frozen`, `go mod download`, `dotnet restore`, `mvn -B -q verify -DskipTests`) |
| Toolchain image (`image:`) | GitLab template | An image with Node ≥ 18 **and** the project toolchain |
| Security jobs | `../../agentic-sdlc/templates/ci/security.yml` | Lockfiles present (osv-scanner input); `.gitleaks.toml` if the project already has one |

Produce these as a short table in the conversation for `deployment-pipeline`; the CI files themselves are not written by this skill.

## 2. CODEOWNERS lines the context depends on

From `../../agentic-sdlc/templates/CODEOWNERS`; the handles are replaced with real teams:

```text
specs/**              @tech-leads @product-owners
AGENTS.md             @tech-leads
CONSTRAINTS.md        @tech-leads
.agentic-sdlc/**      @tech-leads
.github/workflows/**  @tech-leads
```

Add `CLAUDE.md @tech-leads` when the block lives there, and `GLOSSARY.md @product-owners` when the glossary drives acceptance criteria. Without "Require review from Code Owners" these lines are documentation only; the `Enforcement` row stays `installed`, not `proven`.

## 3. Block lines and their evidence

| Block text | Allowed only when | Evidence recorded in the adoption ledger `## Enforcement` |
|---|---|---|
| `Enforcement: branch-protection` | Branch protection (or a ruleset) with ≥ 1 required review, dismiss stale reviews, required checks `agentic-sdlc/dod`, `agentic-sdlc/spec`, `agentic-sdlc/approvals`, **and** each gate seen red once | One red and one green run per check (`prove-the-gate-bites.md` §3 rows) |
| `Enforcement: prompt-only` | Any control above is missing or `unknown` | The probe output; the PR body banner `enforcement: prompt-only — approvals are not system-enforced on this repository` |
| `· permissions: prompt-only` appended to the `Enforcement:` line | The host cannot restrict role tools (`platforms.md` §3 row 7) | The platform name from the probe |
| `Platform: … · enforcement: <value> · ci: <system>` | Rewritten on every probe, exactly per `platforms.md` §1 | Probe date in `## Events` |

The `enforcement:` value on the `Platform:` line and the `Enforcement:` line always agree; when they differ, `prompt-only` wins until the next probe.

## 4. Procedure

1. Re-run the five-check probe (`platforms.md` §1); `unknown` counts as absent.
2. Fill the §1 value table from the block and Step 1 discovery; verify the DoD block passes the CI parser (`dod-block.md` §5).
3. Hand the table to `deployment-pipeline`, which installs the workflows and protection in its own PR (a context PR under S20) and proves each gate.
4. When the proof rows exist, propose the block diff (`Enforcement: branch-protection`) and the ledger rows; show, approve, write.
5. Mark week 3 `Passed on` in the ledger only when every control in `governance.md` §7 is `proven`.

## 5. Failure behaviour

- Required checks named differently from the job names (`agentic-sdlc/dod` vs `dod`) → protection silently never blocks; the probe treats the control as absent.
- A CI workflow that pulls actions by tag or runs `curl | sh` → S17 Important finding; pin by full commit SHA before recording `installed`.
- No admin rights on the host → `deployment-pipeline` manual fallback (`branch-protection.md` §5); the block stays `prompt-only` and the ledger names who holds the rights.
- One-person team: CODEOWNERS approval by the author is impossible; record the sign-off rule from `governance.md` §6.3 in `## Events` and keep `prompt-only` unless the host enforces a second reviewer.
