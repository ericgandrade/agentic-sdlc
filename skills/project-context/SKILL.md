---
name: project-context
description: This skill should be used when the user wants to set up, adopt, refresh or audit the agent instructions for a repository (the AGENTIC-SDLC block in AGENTS.md or CLAUDE.md with its sdlc-dod Definition of Done), enter an existing codebase before the first change, build or refresh the code map, vendor the Agentic SDLC scripts into .agentic-sdlc/bin, define CONSTRAINTS.md, build a GLOSSARY.md, or record a mistake an AI agent made so it is not repeated — the Discover-stage context foundation of the Agentic SDLC.
license: MIT
---

# Project Context

## Purpose

Give every agent session in a repository the same verified starting context: how to build, test and run the project, which Definition of Done every change must pass, how the code is organised, which quality bar must never be lowered, what the domain words mean and which mistakes agents have already made here. This is the **Discover-stage** foundation of the Agentic SDLC: router Step 0 state 1 ("No AGENTS.md block") sends every new project here, later stages read these files instead of re-discovering them, and retro actions (`../agentic-sdlc/references/retrospective.md`) are written back through pitfall mode.

It manages six artifacts, all plain files in the project:

| Artifact | Content | Required on | Mode |
|---|---|---|---|
| AGENTIC-SDLC block in `AGENTS.md` | Commands, conventions, platform line, enforcement line, baseline line, pitfalls | every path | setup, adopt, refresh |
| `sdlc-dod` fenced block (inside the AGENTIC-SDLC block) | The Definition of Done: lint, typecheck, test, coverage commands and `coverage_min` | every path | setup, adopt, refresh |
| `docs/codemap.md` | Module → paths → deploy unit → depends_on → tests (`../agentic-sdlc/templates/codemap.md`) | every repository with existing code | adopt, codemap |
| `.agentic-sdlc/bin/` + `VERSION` + `SHA256SUMS` | The method's scripts, vendored so CI runs them and their provenance is checkable | every project with Node ≥ 18 | vendor |
| `CONSTRAINTS.md` | Floor rules, enforced thresholds with commands, ratchets, exceptions | Full path | constraints |
| `GLOSSARY.md` | Domain terms, one meaning each, aliases to avoid | when Specify defines ≥ 1 domain term | glossary |

Artifact locations and the block format are indexed in `../agentic-sdlc/references/artifacts.md`; the essentials are repeated below so this skill also works alone.

## When to Use

- A repository has no AGENTIC-SDLC block, or its instructions are stale, contradictory or longer than 60 lines.
- First use of the Agentic SDLC on an existing codebase (brownfield): adopt mode runs before the first change.
- The Definition of Done is missing, a DoD command fails, or `coverage_min` needs its first measurement.
- A PR adds, removes or moves a top-level source directory (code map refresh).
- The installed `agentic-sdlc` version differs from `.agentic-sdlc/bin/VERSION`, or `shasum -a 256 -c SHA256SUMS` in `.agentic-sdlc/bin/` reports a mismatch (vendor).
- A Full-path item starts and `CONSTRAINTS.md` is absent.
- Domain vocabulary is ambiguous ("account" means three things).
- An agent made a mistake worth preventing next time, or a retro action targets the instructions.
- Periodic audit: the `Verified:` line is older than 90 days.

Not for product documentation, end-user READMEs or architecture decisions (`senior-solution-architect` writes ADRs).

## Workflow

### Step 0 — Detect mode

Check the rows top to bottom; the first match wins.

| # | Detected situation | Mode |
|---|---|---|
| 1 | User reports, or the session observed, an agent mistake | **pitfall** |
| 2 | User asks about the quality bar, or a Full-path item has no `CONSTRAINTS.md` | **constraints** |
| 3 | User asks about domain terms | **glossary** |
| 4 | Installed skill version ≠ `.agentic-sdlc/bin/VERSION`, or `SHA256SUMS` check fails | **vendor** |
| 5 | A PR adds, removes or moves a top-level source directory, or `docs/codemap.md` is older than 90 days | **codemap** |
| 6 | No block, and the repository has ≥ 1 commit and ≥ 1 source directory | **adopt** (brownfield) |
| 7 | No block, and no commits or no source directory | **setup** (greenfield) |
| 8 | Block exists and the user asks "are these still correct?" or `Verified:` > 90 days | **audit** |
| 9 | Block exists | **refresh** |

When the user's stated intent contradicts detection (asks for setup but source code exists), show the evidence (`git log --oneline -1`, the source directories found) and run adopt mode: adopt is a superset of setup.

### Step 1 — Discover before asking (setup, adopt, refresh, audit)

Never ask what the repository can answer. Read, in this order:

1. Existing instruction files: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, contribution guides, PR templates.
2. Build and dependency manifests: `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `*.csproj`, `Makefile`.
3. CI configuration: `.github/workflows/`, `.gitlab-ci.yml`, `azure-pipelines.yml`.
4. Linters, formatters, type checkers, test runners, coverage tools and their configs.
5. History: `git log --oneline -30` for commit style and branch names.
6. Existing spec conventions: `specs/*/spec.md`, `.kiro/specs/`, `openspec/changes/`, `docs/adr/` (decision rule in `../agentic-sdlc/references/artifacts.md` §Step 0).
7. Platform capabilities: the five-check probe in `../agentic-sdlc/references/platforms.md` §1 (subagents, shell, Node ≥ 18, host enforcement, CI).

Verify every command the block will state: run it when it finishes in ≤ 5 minutes and has no side effects outside the working tree; otherwise read the script it invokes and mark it `(read, not run)`. A command that does not exist yet (greenfield) is written as `n/a — <reason>` with the chosen stack named, never as a guess stated as fact.

Report findings in ≤ 10 lines, then move to the gaps.

### Step 2 — Adopt mode: explore and document before the first change

Adopt mode is the brownfield entry procedure of the method (`../agentic-sdlc/references/paths.md` §5). Until it completes, no code change starts: the router reports state 1 and the agent answers any code request with status `BLOCKED`, next step `project-context` (adopt).

1. **Inventory.** List top-level directories (`git ls-files | cut -d/ -f1 | sort -u`); in monorepos descend one level into `apps/`, `packages/`, `services/`. Classify each as source, test, docs, generated, vendored or fixtures.
2. **Baseline.** Run the full test suite and the coverage command once. Record: date, 12-hex commit SHA, passing / total tests, coverage %, and the IDs of failing tests.
3. **Conventions.** From history and configs: branch naming, commit style, layering rules, folders agents must not touch. Each convention kept in the block names its evidence (file or commit).
4. **Code map.** Step 5.
5. **Instruction ledger.** For every existing instruction line: decision (retain, rewrite, relocate, automate, delete) and reason. Existing content is the baseline and is never discarded silently: a deletion needs a reason (obsolete, duplicated, enforced by a tool, contradicted by the repository) and approval line by line.
6. **Block, DoD, vendor.** Steps 3, 4 and 6.

Output: the AGENTS.md block with its `Baseline:` line, `docs/codemap.md`, the ledger (shown, not stored), `.agentic-sdlc/bin/`.

Failure behaviour:

- Baseline red → list every failing test ID in `Baseline: … red: <ids>` and open one issue labelled `baseline-red` per test. Build preflight halts on a red baseline until each test is fixed or covered by a waiver (`../agentic-sdlc/references/governance.md` §Waivers). Failing tests are never deleted or skipped to get green.
- No test suite → `Baseline: no tests`; `test: n/a — no test suite` in `sdlc-dod`; every first change on that code is at least Standard and starts with characterization tests (`CHAR-n`).
- Suite runs longer than 15 minutes → record the run time; the DoD `test` key names the fastest command that covers the changed modules, and the full suite runs in CI.

### Step 3 — Interview only the gaps

Ask one question at a time, at most 5 questions per session, only about what no file reveals:

- What do agents keep getting wrong here?
- Which areas are off limits or frozen?
- Which rules come from outside the repository (security policy, compliance, client contract, style guide)?
- Who holds the four approval roles (Product Owner, Tech Lead, PR reviewer, Release Owner)? One person can hold several.

Never ask the user to confirm something a file already states. When the repository contradicts the user, show the evidence and ask which is right.

### Step 4 — Compose the block and the Definition of Done

Keep the block ≤ 60 lines: every line is paid for in every future session. Include only what an agent would get wrong without it.

````markdown
<!-- AGENTIC-SDLC:BEGIN -->
## Agentic SDLC
- Build: `<verified>` · Run: `<verified>`
- Artifacts: `specs/NNN-slug/` · ADRs: `docs/adr/` · Code map: `docs/codemap.md` · Quality bar: `CONSTRAINTS.md` (Full path) · Vocabulary: `GLOSSARY.md`
- Conventions: branch `feat/NNN-slug`; commit trailer `Refs: Tn AC-n`; <only non-obvious ones, each with evidence>
- Roles: Product Owner <name> · Tech Lead <name> · Reviewer <name> · Release Owner <name>
- Platform: <platform> · subagents: yes|no · shell: yes|no · node: <version>|absent · ci: <system>|none
- Enforcement: branch-protection | prompt-only
- Tools: `.agentic-sdlc/bin/` agentic-sdlc <version> (verify: `shasum -a 256 -c SHA256SUMS`)
- Baseline: <YYYY-MM-DD> at <sha12> · tests <pass>/<total> · coverage <n>% · red: <ids>|none

## Definition of Done
```sdlc-dod
lint: <verified command>
typecheck: <verified command>
test: <verified command>
coverage: <verified command>
coverage_min: <baseline %>
```

## Pitfalls (observed agent mistakes)
- <YYYY-MM-DD> — <observed mistake> → <correct behaviour>
<!-- Verified: <YYYY-MM-DD> at <commit SHA> -->
<!-- AGENTIC-SDLC:END -->
````

**Definition of Done rules (`sdlc-dod`, required on every path):**

| Rule | Value |
|---|---|
| Format | One `key: command` per line; keys `lint`, `typecheck`, `test`, `coverage`, `coverage_min` |
| Missing tool | `<key>: n/a — <reason>` (for example `typecheck: n/a — plain JavaScript`) |
| Verification | Every command runs once at setup and exits 0 on the baseline commit, or is listed in `Baseline: … red:` |
| `coverage_min` | The coverage measured at adoption, one decimal. Never lowered; a higher measured value at a later refresh becomes the new floor |
| Consumers | `dod-gate`† before the PR opens and as CI check `agentic-sdlc/dod`; the Implementer before any completion claim; `preflight` (baseline-dod); the doctor† |

Failure behaviour: the block is not written without the `sdlc-dod` fence. A missing fence later → `preflight` and `run-ledger start` exit 2 (`dod-gate`† exit 2 and doctor† FAIL). A request to lower `coverage_min` or delete a DoD key → refuse; the only route is a waiver with an owner ≠ requester and an expiry ≤ 30 days.

Leave out what manifests already say plainly, generic advice ("write clean code") and anything a tool enforces. For each candidate rule, check whether a lint rule, hook or CI check enforces it; when one does, propose the check and keep the line only until the check is merged.

**Block location.** The block lives in `AGENTS.md`. Every other instruction file the platform reads (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`) gets one pointer line instead of a copy (`../agentic-sdlc/references/platforms.md` §2). A project that keeps only `CLAUDE.md` and refuses a new file → the block goes into `CLAUDE.md` and the location is recorded in the block's first line.

### Step 5 — Write the code map (adopt and codemap modes)

Use `../agentic-sdlc/templates/codemap.md`; write `docs/codemap.md`.

1. One module per top-level source directory; in monorepos one module per package or service. Bound: ≤ 30 modules; above that, group by deploy unit.
2. `paths`: the directory globs the module owns. Every top-level directory appears in exactly one module or in `excluded` with a reason.
3. `deploy`: the separately built or deployed unit (from the Dockerfile, the deploy job in CI or the manifest). Distinct `deploy` values are the "components" input of the path score.
4. `depends_on`: other modules imported (search import statements, ≤ 20 files sampled per module) and `ext:<package>` for external services that matter for impact.
5. `tests`: test paths that exercise the module, from the test runner config or naming; `[]` for an untested module.
6. `verified: <date> at <sha12>`.

Output: `docs/codemap.md`, committed with the block.

Failure behaviour: a directory that cannot be classified → `excluded` with `reason: unknown — ask` and one question to the user. A plan touching a module missing from the map → the Architect updates the map first, in the same PR. Map older than 90 days or a top-level directory unmapped → doctor† WARN and codemap mode at the next Discover stage.

### Step 6 — Vendor the scripts (vendor mode; last step of setup and adopt)

Copy the method's deterministic gates into the project so CI runs the same code the agent runs, and so tampering is detectable (mechanisms 11.5-iii and 15.2).

1. **Source.** The installed `agentic-sdlc` skill: `<skill dir>/scripts/*.mjs` and `<skill dir>/scripts/lib/*.mjs`. Never `scripts/test/`.
2. **Copy** into `.agentic-sdlc/bin/` and `.agentic-sdlc/bin/lib/`, keeping file names, so relative imports resolve.
3. **Write `VERSION`:**
   ```
   agentic-sdlc <Version from the skill README Metadata table>
   release: v<claude-superskills release>|unknown
   source: <absolute path of the installed skill>
   vendored: <YYYY-MM-DD>
   ```
4. **Write `SHA256SUMS`** (sorted, paths relative to `bin/`):
   ```
   cd .agentic-sdlc/bin && find . -name '*.mjs' -type f | sed 's|^\./||' | LC_ALL=C sort | xargs shasum -a 256 > SHA256SUMS
   ```
   Use `sha256sum` where `shasum` is absent; the output format is identical.
5. **Verify:** `cd .agentic-sdlc/bin && shasum -a 256 -c SHA256SUMS` → every line `OK`. Then `node .agentic-sdlc/bin/<script>.mjs --help` exits 0 for every vendored script when Node ≥ 18 is present.
6. **Commit** `.agentic-sdlc/bin/` with the block. `.agentic-sdlc/config.json` (project overrides) and the block are never touched by a re-vendor; only `bin/` is replaced.

Failure behaviour:

- Checksum mismatch at any later check (`shasum -a 256 -c SHA256SUMS`, or the doctor†) → FAIL; never patch a vendored file by hand: re-vendor from the pinned release and review the diff.
- A script named in the router's Module Index absent from the installed skill → vendor the scripts that exist and add `missing: <names>` to `VERSION`; the router falls back to the Markdown rule for each.
- Node absent or < 18 → vendor anyway (files are inert), set `node: absent` on the Platform line and `Enforcement: prompt-only`; the method runs on the Markdown-only path (`../agentic-sdlc/references/platforms.md` §4).

### Step 7 — Show, approve, write

Show the complete block, the ledger (adopt/refresh), the code map summary and the vendored file list before writing. Ask for a decision and end the turn; write only after an explicit "yes" in a later turn. Replace only the content between the markers; text outside the markers changes only through an approved ledger entry. Another loaded instruction file that contradicts the block → propose the fix in the same review: two live contradictory instructions is a defect. Never commit without the user's go-ahead.

### Constraints mode — CONSTRAINTS.md (required on the Full path)

1. Detect the current state: test runner, coverage output, linters, CI, security scanners.
2. Ask at most four questions, each with a default so "not sure" still produces a working file:
   - Which dimensions beyond the floor? (default: coverage on changed lines + dependency security)
   - Block or warn when a check fails mid-task? (default: block on the floor, warn on the rest for 14 days)
   - Target numbers, or measure today and hold the line? (default: measure and hold)
   - Slowest acceptable check at task end? (default: 90 seconds; slower checks run in CI)
3. Write four sections:
   - **Floor** (always enforced): no new suppression comments, no unimplemented stubs or empty catch blocks, no skipped or deleted tests without a reason, no secrets in source, this file is not weakened to make a change pass.
   - **Enforced with numbers**: one row per dimension: rule, exact command that produces the verdict, when it runs. A number without a command is an aspiration, not a constraint.
   - **Ratchets**: metric, today's value, direction ("must not fall"), compared against the recorded value.
   - **Exceptions**: rule, path, reason, owner, expiry ≤ 30 days.
4. Defaults when the user has no opinion: changed-line coverage ≥ 80%; project coverage must not fall below `coverage_min`; 0 dependency advisories at high or critical; 0 critical/serious accessibility violations on new UI. State each number with its reason.
5. Include ≥ 1 external check (vulnerability database, accessibility engine, real-browser metrics): a bar built only from the project's own tests is satisfied by code that does not work.

Failure: loosening any rule needs an ADR and Design sign-off; a diff that weakens the file without both → Critical review finding.

### Glossary mode — GLOSSARY.md

One entry per term: definition in the domain's language, aliases to avoid, one example, source. A word with two meanings is split into two terms, recording which one the code uses. Vocabulary choices that rename code symbols become ADRs via `senior-solution-architect`.

### Pitfall mode

Capture the task, the mistake, the correct behaviour and the evidence (command output, diff, file). Check whether a line already covers it. A one-off is noted in the session; a mistake seen twice, or one that cost ≥ 1 review round, earns a pitfall line now. A mechanically preventable mistake gets a proposed check (lint rule, hook, DoD key) in addition to the line. Show the diff before writing. Retro actions arrive here with their retro date as the line's date.

### Audit mode

1. Re-run or re-read every command in the block and the `sdlc-dod` fence.
2. Compare `git log <Verified SHA>..HEAD --stat` against the block and the code map: list lines whose evidence is gone and directories not mapped.
3. Run `shasum -a 256 -c SHA256SUMS` in `.agentic-sdlc/bin/` and re-run the platform probe.
4. Re-measure coverage; a higher value raises `coverage_min`.

Output: a findings list (line · evidence gone · proposed edit). Every removal is shown for approval; nothing is edited silently. Update `Verified:` only after the approved edits are written.

## Critical Rules

- **NEVER** state an unverified command as fact; run it, read its script, or write `n/a — <reason>`.
- **NEVER** write the block without the `sdlc-dod` fence, and never lower `coverage_min`.
- **NEVER** start a code change in an existing repository before adopt mode has recorded the baseline and the code map.
- **NEVER** overwrite content outside the `AGENTIC-SDLC` markers without an approved ledger entry.
- **NEVER** discard existing instructions during adoption; they are the baseline.
- **NEVER** edit a vendored file in `.agentic-sdlc/bin/` by hand; re-vendor and re-check `SHA256SUMS`.
- **NEVER** weaken CONSTRAINTS.md to make a change pass.
- **ALWAYS** discover before asking, and ask one question at a time.
- **ALWAYS** prefer an automated check over a prose rule.
- **ALWAYS** keep the block ≤ 60 lines and dated with the verification SHA.
- **ALWAYS** keep secrets, personal data and client data out of every file this skill writes.

## Example Usage

**1. Setup on a new repository.** "Set up the Agentic SDLC here." No commits with source yet → setup. Reads `package.json` (`vitest`, `eslint`, `tsc`), runs each, finds no coverage tool → `coverage: n/a — no coverage tool yet`, `coverage_min: n/a`. Probe: Claude Code, subagents yes, Node 20.11, no CI → `ci: none`, `Enforcement: prompt-only`. Vendors the scripts with `VERSION` and `SHA256SUMS`. Shows a 24-line block and ends the turn; writes after "yes".

**2. Adopting an existing service (brownfield).** "Use the Agentic SDLC on our billing API." Adopt mode: 7 top-level directories, baseline 412/415 tests passing and coverage 71.3% at `3f9c2a7d1e04`. Three red tests → `Baseline: … red: T-88, T-91, T-102` and three `baseline-red` issues. Code map: 6 modules in 2 deploy units, `legacy/` with `tests: []`. Ledger for the old 300-line CLAUDE.md: 22 retained, 9 rewritten, 14 relocated, 6 automated, 11 deletions proposed with reasons. `coverage_min: 71.3`. No code changes until approval.

**3. Defining the quality bar for a Full-path item.** "Agents keep adding `@ts-ignore` to get green builds." Constraints mode: floor bans new suppressions; changed-line coverage ≥ 80% via `vitest --coverage`; `osv-scanner` for advisories; project coverage 61.2% as a ratchet. Adds the "never weaken" line to the block.

**4. Upgrade with a checksum mismatch.** `shasum -a 256 -c SHA256SUMS` in `.agentic-sdlc/bin/` prints `plan-graph.mjs: FAILED`. Vendor mode: the diff shows a local edit; it is reverted by re-vendoring from agentic-sdlc 2.0.0, the check passes, and a pitfall line records "edited vendored script → change the skill upstream".

**5. Recording a pitfall.** "The agent ran `pytest` outside the virtualenv again." Second occurrence → pitfall line `2026-11-19 — plain pytest runs outside the project env → use uv run pytest`, plus `test: uv run pytest` in `sdlc-dod` as the durable fix.

† Added in a later release; manual fallback in `agentic-sdlc/references/artifacts.md` §Later-release files.

## Sources

The managed instruction block, adoption ledger and recorded pitfalls adapt BMad Method's (MIT) project-context practice; the floor/ratchet/exception structure adapts Addy Osmani's agent-skills (MIT) constraint-driven development; glossary discipline and environment-first retro fixes adapt Matt Pocock's skills (MIT). Script vendoring with checksums is original to this method.
