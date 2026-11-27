# Agentic SDLC v3.1 → v3.4 Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `executing-plans` to implement this plan task by task, test first. Phases are ordered and each ends with an exit gate. Tasks marked ∥ touch disjoint files and may run in parallel.

**Goal:** close every gap found by the independent round-3 re-score (85.0 ±2.7, first of ten, not "Superior" because C15 sits below the benchmark median) and by the market-learnings review, **without making the method heavier for a real team**.

**Objective and tie-break (grill Q1).** Two objectives, in this order:
1. **Adoptable by a real team**, measured in the pilot (Phase 2): time to first merged change, ceremony hours per feature, tokens per feature, escaped defects.
2. **Keep first place and earn the "Superior" verdict** under the frozen rules.

When an item raises the score but adds ceremony or tokens with no measured benefit for the team, it ships as opt-in (template, Full path or extension) and stays off the Standard path.

**Architecture:** every new mechanism is a dependency-free Node ≥ 18 ES module in `skills/agentic-sdlc/scripts/`, built on `lib/cli.mjs` (exit codes and `--json`), `lib/git.mjs` (fingerprints) and `lib/md.mjs` (sections, `contentHash`). Each one is tested with `node --test` against temporary repos from `scripts/test/helpers.mjs`, and called by a mandatory step on the default path.
- **Exit codes:** 0 pass · 1 check failed · 2 input missing or unparsable · 3 bound reached.
- **Output:** a script replaces prose. The agent runs the check and reads a short result instead of reading a long reference.

**Tech stack:** Node ≥ 18 (no npm dependencies in method scripts) · Markdown skills · GitHub Actions and GitLab CI templates · host permission configs from `skills/agentic-sdlc/references/platforms.md` §Agents, tools and permissions.

**Inputs:**
- `docs/research/scoring/round3-independent/`: scores, lenses, audit;
- `docs/plans/2026-11-25-roadmap-v3.md`: D1–D12, G1–G8, the v3.2 and v3.3 rows;
- the round-3 audit's per-criterion "what is missing" list.

**Out of scope:** changing the frozen methodology v1 or rubric v2; any score claim before an independent re-score; porting the scripts to another language (grill Q2).

**Ownership (grill Q9):** the maintainer owns every phase and reviews every PR. Executing agents implement one task per fresh context. Pilot-team leads own the pilot metrics. Durations assume one maintainer with agents and are estimates.

---

## Phase 0 · Foundations (2–3 days, v3.0.2)

### Task 0.1 · Run the method's own tests in CI

The 127 script tests in `skills/agentic-sdlc/scripts/test/` are not run by any CI job today. `cli-installer` `npm test` only checks the installer.

**Files:**
- Modify: `.github/workflows/validate.yml`. Add this job:

```yaml
  method-scripts:
    name: Method scripts (node --test)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: node --test skills/agentic-sdlc/scripts/test/*.test.mjs
      - run: node skills/agentic-sdlc/scripts/budget-check.mjs skills/agentic-sdlc
```

**Steps:**
1. Add the job and push the branch. Expected: the job is green.
2. Prove that it blocks: break one assertion locally, run `node --test skills/agentic-sdlc/scripts/test/*.test.mjs` and expect FAIL. Revert the assertion.
3. Commit: `ci: run the method's script tests and budgets on every PR`.

### Task 0.2 · Default-path token budget (grill Q4) ∥

Every later task adds text, so the plan needs a guard before it starts.

**Files:**
- Create: `skills/agentic-sdlc/references/default-path.json`. It is the ordered list of files the Standard path requires (T2 + T3), taken from the round-3 `lenses.json` `L5.T3` list with repository-relative paths.
- Modify: `skills/agentic-sdlc/scripts/budget-check.mjs` to add `--default-path`. It sums tokens with the proxy `ceil(chars / 4)` over that list, de-duplicated, and compares the sum against `BUDGETS.defaultPathTokens`. The budget starts at the measured baseline and may never rise.
- Test: `skills/agentic-sdlc/scripts/test/budget-check.test.mjs`.

**Tests first:**
- a fixture under budget → exit 0;
- a fixture over budget → exit 1 with `DEFAULT_PATH`;
- a missing listed file → exit 2;
- a duplicated entry is counted once.

**Steps:**
1. Write the tests; expect FAIL.
2. Implement the flag; expect PASS.
3. Record the baseline in §Baseline below.
4. Wire `--default-path` into the CI job of Task 0.1.
5. Commit.

**Rule for every later task:** a PR that raises the default-path total must remove at least as many tokens elsewhere, or move the new text behind a trigger.

### Task 0.3 · Owner decisions (no code)

| Decision | Default if not decided in 3 days |
|---|---|
| Merge the round-3 story branch `docs/independent-rescore` | Merge |
| The P1–P28 pattern list on `docs/roadmap-runtime-loop` | Keep as generic patterns with no source attribution |
| The pilot team and a real feature for Phase 2 | Blocks Phase 2 |

**Recorded 2026-11-27 (owner had not decided; defaults assumed, nothing executed):**
- `docs/independent-rescore`: default assumed is *merge*, but it is **not merged** on this branch. Pending owner action. The round-3 files cited below are read from that branch at `b09f1ac`.
- `docs/roadmap-runtime-loop`: default assumed is *generic patterns, no source attribution*. The branch is untouched. Pending owner action.
- Pilot team and feature: not chosen. Phase 2 stays blocked.

### Baseline (recorded 2026-11-27 on `origin/main` @ `22c649f`, v3.0.1)

| Measure | Value | How |
|---|---|---|
| Script tests | 132 (the plan draft said 127; 132 measured) | `node --test skills/agentic-sdlc/scripts/test/*.test.mjs` summary |
| Default-path tokens (proxy) | 121,502 over 57 files (T2 2 + T3 55) | `budget-check --default-path --json`; pinned as `BUDGETS.defaultPathTokens` |
| Reference values from round 3 (tiktoken o200k_base) | T1 4,114 · T2 6,546 · T3 118,364 | `docs/research/scoring/round3-independent/tokens.json` (branch `docs/independent-rescore` @ `b09f1ac`) |
| † items in the router Module Index | 14 lines (23 † characters) | `grep -c "†" skills/agentic-sdlc/SKILL.md` |
| First-path words | 3,432 / 3,700 | `budget-check` |

**CI note:** `validate.yml` runs on pull requests to `main` and pushes to `main` only. Pushes to a feature branch run no job, so "CI green" for this plan's branch is confirmed only once a pull request is opened. Until then every job's commands are run locally.

---

## Phase 1 · v3.1.0 "Superior and easier" (about 2 weeks; projected 90.0)

Only items that unlock the verdict or reduce friction (grill Q1).

### Task 1.1 · Versioned extension interface (C15 2 → 3, possibly 5; unlocks S4)

**Files:**
- Create: `skills/agentic-sdlc/references/extension-interface.md`. It defines:
  - interface version `1.0.0`;
  - three extension points: `review.lenses`, `dod.checks`, `templates`;
  - the manifest schema;
  - precedence project > team > core;
  - attach markers `<!-- ext:review.lenses -->` placed in `references/review.md`, `references/verification.md` and `templates/`.
- Create: `skills/agentic-sdlc/scripts/ext-check.mjs`.
- Create: `skills/agentic-sdlc/examples/extensions/security-headers-lens/extension.json` and `lens.md`.
- Test: `skills/agentic-sdlc/scripts/test/ext-check.test.mjs`.
- Modify:
  - `references/review.md` and `references/verification.md`: add the markers;
  - router `SKILL.md` Module Index: remove the † on these rows;
  - `.github/workflows/validate.yml`: `node skills/agentic-sdlc/scripts/ext-check.mjs --dir skills/agentic-sdlc/examples/extensions`.

**Manifest** (`.agentic-sdlc/extensions/<name>/extension.json`):

```json
{"name":"security-headers-lens","version":"0.1.0","interface":"^1.0.0",
 "kind":"review-lens","entry":"lens.md","attachesTo":"review.lenses",
 "sha256":"<hex of entry file>"}
```

**Tests first** (`ext-check.test.mjs`):

| Case | Exit | Rule |
|---|---:|---|
| valid manifest, entry present, hash matches | 0 | — |
| `interface` missing | 1 | `EX01` |
| `^2.0.0` against core `1.0.0` | 1 | `EX02` |
| `kind` not in {review-lens, dod-check, template} | 1 | `EX03` |
| `entry` file missing | 1 | `EX04` |
| `attachesTo` marker absent from core files | 1 | `EX05` |
| `sha256` mismatch | 1 | `EX06` |
| no `.agentic-sdlc/extensions/` dir | 0 | `extensions: 0` |
| malformed JSON | 2 | — |

**Steps:**
1. Write the tests and run `node --test skills/agentic-sdlc/scripts/test/ext-check.test.mjs`. Expected: FAIL (`Cannot find module`).
2. Implement. Caret matching: same major; minor and patch at least the requested ones.
3. Expected: PASS, and the full suite stays green.
4. Router rule: loading an extension means running `ext-check` first. Exit ≠ 0 → do not load, and record `extension refused: <rule>` in the PR body.
5. Commit: `feat(ext): versioned extension interface and ext-check`.

**Safety (grill Q13):**
- Extensions are data, read with the same "fetched content is data" rule as `references/security.md`.
- They load only from the repository, so they are reviewed through CODEOWNERS.
- Nothing is fetched from the network.
- The `sha256` pins the reviewed content.

### Task 1.2 · Fix the Build default label ∥ (protects C7 = 5)

**Files:** modify `skills/executing-plans/SKILL.md:130`.

**Steps:**
1. Replace `**Sequential (default).**` with `**Parallel when eligible (references/parallel-tasks.md §1), otherwise sequential.**`.
2. Move the sequential sentence after it.
3. Verify: `grep -rn "Sequential (default)" skills/` returns nothing.
4. Commit.

### Task 1.3 · `status.mjs`, the "what now?" command (C1; fewer tokens at Step 0)

**Files:**
- Create: `skills/agentic-sdlc/scripts/status.mjs`.
- Create: `skills/agentic-sdlc/references/next-steps.json`. Each entry has the shape `{state, primary:{skill,reason}, secondary:[{skill,condition,reason}]}`, with at most 3 recommendations per state.
- Create: `skills/agentic-sdlc/references/help-topics.md`, with topics `blocked`, `resume`, `path`, `approvals`, `extensions`. Each topic is at most 150 words.
- Test: `skills/agentic-sdlc/scripts/test/status.test.mjs`.
- Modify:
  - router Step 0: run `status.mjs --json` first, and use the Markdown table only when Node is absent;
  - every stage skill: the closing line prints `status.mjs --next`.

**Contract:**
- `status.mjs [--json] [--next] [--topic <name>]` reads `specs/*/spec.md`, `approvals.md`, `plan.md`, the run ledgers and PR files.
- It prints the state, the evidence for it (file:line) and the next steps.
- Exit 2 on an unparsable artifact, with the `UNKNOWN` state.

**Tests first:**
- one fixture repo per row of the router Step 0 table, asserting the expected state and primary skill;
- a CI assertion that every `skill` named in `next-steps.json` exists under `skills/`;
- a drift test (grill Q12): the router's Step 0 table is parsed and must list the same states as `next-steps.json`.

**Token rule:** `budget-check --default-path` must not rise. Step 0 now reads one script result instead of the state table.

### Task 1.4 · `doctor.mjs` + `references/upgrading.md` (C1 4 → 5) ∥

**Files:** create `scripts/doctor.mjs`, `scripts/test/doctor.test.mjs` and `references/upgrading.md`. Modify `skills/project-context/SKILL.md` (setup ends with `doctor`).

**Checks, in order (each `ok` / `warn` / `fail`, each printing the command that fixes it):**
1. Node ≥ 18.
2. Vendored scripts match `.agentic-sdlc/bin/SHA256SUMS`.
3. The `sdlc-dod` block parses.
4. Each DoD command resolves on the PATH.
5. `docs/codemap.md` is at most 90 days old (brownfield only).
6. The `Enforcement:` line matches reality: CI files present, and host permission config present.
7. Extensions pass `ext-check`.

Behaviour:
- Writes `.agentic-sdlc/doctor.json`.
- Exit 1 on any `fail`.
- Reports `enforcement: prompt-only` when Node or the host config is absent (grill Q2, Q6).

**Tests first:** one passing and one failing fixture per check.

**`upgrading.md`:** one section per release from 3.0.0, with the breaking changes, the migration commands and what `doctor` will flag.

### Task 1.5 · Gates on day 1, branch protection in week 3 (C11 → 5; C3 and C10 backup; grill Q3)

**Decision:**
- At **adoption**, `project-context` installs the CI jobs `agentic-sdlc/dod`, `agentic-sdlc/approvals`, `security.yml` (gitleaks, osv-scanner) and `CODEOWNERS`. These need repository write access, not admin rights.
- Reviewer rule: GO requires these checks to be green.
- **Branch protection** still waits for week 3, because it needs admin rights and is the strongest step.
- Teams without Node locally still get the gates, because CI runs them (grill Q2).

**Files:** modify:
- `skills/project-context/SKILL.md` (adopt mode, steps for the CI files);
- `skills/project-context/references/enforcement-setup.md`;
- `skills/agentic-sdlc/references/adoption.md` §2 (the rollout table: gates on day 1; branch protection, Full path and unattended runs in week 3);
- `skills/agentic-sdlc/references/review.md` (GO requires green CI checks);
- `skills/agentic-sdlc/templates/pr-body.md` (an SSDF mapping line);
- the worked example and the quickstart.

**Verify:**
- `./scripts/validate-skill-content.sh skills/project-context/`;
- `./scripts/validate-skill-content.sh skills/agentic-sdlc/`;
- the trigger evals in `skills/project-context/evals/` still pass;
- the default-path budget does not rise.

**Rollback (grill Q11):** a gate that blocks wrongly is waived with the existing waiver procedure (`references/governance.md` §6: owner ≠ requester, expiry ≤ 30 days). It is never deleted.

### Task 1.6 · `dod-gate.mjs` (C3 4 → 5)

**Files:**
- Create: `scripts/dod-gate.mjs` and `scripts/test/dod-gate.test.mjs`.
- Modify: `scripts/run-ledger.mjs` (`task --state done` and `finish` call the gate in-process); `references/verification.md`; router index.

**Contract:**
- Reads the `sdlc-dod` block.
- Runs each command in the current worktree.
- Records `{name, cmd, exit, stdoutSha256, fingerprint, agent:{host, model}}`. The agent context comes from the learnings review: AI context inside the evidence.
- Exit 0 only if every command exits 0 on the **current** fingerprint.
- A green result from an older fingerprint counts as stale → exit 1.

**Tests first:**
- all green → 0;
- one red → 1, naming the command;
- no block → 2;
- a file edited after green → 1 `STALE`;
- `run-ledger task --state done` is refused (exit 1) while the gate is red, and accepted once it is green.

### Task 1.7 · Honest index ∥

**Files:** router `SKILL.md` Module Index and `references/artifacts.md` §Later-release files.

**Steps:**
1. Remove the † from every item shipped in Phase 1.
2. Move the remaining items to a "Planned" table with the target version, out of the router body. This also saves T2 tokens.

**Verify:** the † count is lower than the Phase 0 baseline.

### Task 1.8 · Release v3.1.0 (grill Q8)

**Steps:**
1. Run `node scripts/release.js minor`.
2. Update every file in the CLAUDE.md version table.
3. Write the CHANGELOG entry, with a **migration** section: existing adopters run `project-context adopt --upgrade`, and `doctor` lists what is missing.
4. Update README "What's in".
5. Confirm `validate.yml` is green.

### Phase 1 exit gate

- [ ] All CI jobs green, including `method-scripts`, `ext-check` and the default-path budget.
- [ ] `doctor` PASS on two fixture projects, one Node and one non-Node with CI.
- [ ] An agent re-runs the worked example end to end with the new gates, and the trial report is updated.
- [ ] **Round 4** independent re-score, same protocol as round 3 (new scorers calibrated on BMad, red team, lenses). The expected check is that S4 holds (grill Q5, Q18).
- [ ] An issue "Score your method with our yardstick" is opened, inviting external scorers (grill Q5).

---

## Phase 2 · Pilot with a human team (2–3 weeks, between v3.1 and v3.2) (grill Q1, Q10)

### Task 2.1 · Pre-register the pilot (before the team starts)

**Files:** create `docs/research/pilot-2027/protocol.md`. It holds:
- the team (3–8 people) and one real Standard feature in an existing service;
- the metrics and how each is measured:
  - time to first merged change, from install to merge;
  - ceremony hours per feature, from time logged on sign-offs and reviews;
  - tokens per feature, from host usage logs;
  - escaped defects at 30 days;
  - waits for approval;
  - gate false positives;
- **thresholds written down before the pilot.** They are hypotheses, for example time to first merged change ≤ 1 working day and ceremony ≤ 20% of feature time.

### Task 2.2 · Run and report

**Files:** create `docs/research/pilot-2027/report.md`.

**Decision rule:**
- every gate that missed its threshold or produced false positives is re-designed or moved to opt-in before Phase 3;
- every item of Phases 3–4 is re-ranked with the pilot data.

The report is published whatever the result.

---

## Phase 3 · v3.2.0 "Enforced" (about 30 days; projected 95.2; re-ranked by the pilot)

| # | Task | Criterion | Contract | Tests first |
|---|---|---|---|---|
| 3.1 | `evidence.mjs record/check` | C4 → 5 | `record -- <cmd>` runs the command and appends `{cmd, exit, stdoutSha256, fingerprint, at, agent}` to `.agentic-sdlc/evidence/ledger.jsonl`. `check [--ac AC-n]` exits 1 unless each AC's test has a green row on the current fingerprint. Reviewer GO and Test sign-off require `check` exit 0. **Tamper note (grill Q14):** the local ledger protects against mistakes; CI re-runs the DoD on its own and is the source of truth against tampering. Unattended runs protect the ledger path (G5) | pass; stale; missing AC; torn last line ignored; other invalid line → 2 |
| 3.2 | `approval-check.mjs` + `audit-export.mjs` | C10 → 5 | Verifies each sign-off row (role, person, exact words, rev, 12-hex `contentHash`, time) against the artifact, runs on every PR, and rejects approver = PR author unless a waiver applies. Optional: a sign-off can be recorded as a signed commit with an `Approved-by:` trailer, an idea from the learnings review. `audit-export` writes a JSON and CSV bundle with the hashes and SSDF tags | hash mismatch; missing role; silence not approval; approver = author |
| 3.3 | Host-enforced authority guard | C8 → 5 · F21 → 2 | `project-context` writes host configs for the 5 hosts with concrete controls in `platforms.md` (Claude Code `permissions.deny` + a blocking `PreToolUse` hook; Copilot CLI `--deny-tool`; Codex `sandbox_mode`; OpenCode `permission`; Gemini `tools.exclude`). The other 3 hosts are reported as `prompt-only` by `doctor`, never silently (grill Q6). Three interactive gates: (a) the hook records each real human turn, and a sign-off without one is refused; (b) code writes are blocked before a valid Design sign-off on Standard/Full; (c) the method's own config and instruction files are protected. Never use one exit code for two states | refused push (red) and allowed read (green); sign-off with no human turn refused; code write before approval refused; edit of a protected path refused |
| 3.4 | `trace-check.mjs` | C9 → 5 | Follows AC → task → `Refs:` trailer → test name → PR trace row → release notes → ops record. Writes `specs/NNN/trace.md`. Exit 1 on an orphan, on a test filter selecting 0 tests, or on an ops reading older than 14 days. CI job `agentic-sdlc/trace` | each orphan type; zero-test filter; stale ops reading |
| 3.5 | Decisions on Standard | F6 → 2 | `plan.md` `## Decisions` is required on Standard for any task that adds a component, data model or integration. `plan-graph --check` exit 1 when such a task has no decision row | plan without decisions on a new component → 1 |
| 3.6 | Release v3.2.0 | — | As in Task 1.8 | — |

**Dependencies (grill Q16):** 3.3 needs 1.4 (`doctor` reports enforcement); 3.1 needs 1.6 (shared fingerprint record); 3.2 needs 1.5 (the CI approvals job).

---

## Phase 4 · v3.3.0 "Autonomous and lean" (60–90 days; projected 98.8)

| # | Task | Lens / criterion | Contract and conditions |
|---|---|---|---|
| 4.1 | Token diet | L5: T3 from 118k (round-3 tiktoken) to ≤ 60k | Orchestration skills become human-triggered only, which takes them out of T1. The router body stays ≤ 2.5k tokens. References are loaded by section anchor, not as whole files. Subagent briefs are ≤ 400 words. The model is chosen per role (documented in `platforms.md`). Measure before and after with `budget-check --default-path`, and confirm in the next re-score with tiktoken |
| 4.2 | `run-driver.mjs` (A4) | L3 A3 → A4 · F18 → 2 | **Conditional on the pilot showing demand for unattended runs (grill Q7).** Implements D1–D12 and G1–G8 from the v3 roadmap, plus four rules: (a) the task queue is frozen at run start, and CLI flags may only narrow it; (b) one run at a time, with a lock and cooperative abort; (c) setup commands run in their own process group; (d) a task counts as done only if its task file changed since launch. It always writes a human report plus clean `--json`, and ships only with 3.3. Tests: refused push; kill between "intent written" and "session launched", then resume; torn ledger line; stall; changed policy layer on resume; protected path touched |
| 4.3 | Full extension interface | C15 → 5 (if 1.1 stopped at 3) | Adds agents by trigger, then extension points for DoD checks and templates. Generated per-host shims are drift-checked in CI. `status.mjs --topic extensions` lists the installed extensions. A `customize` helper writes a correct override from a plain-language request |
| 4.4 | `metrics.mjs` | C16 → 5 | Lead time, change-failure rate, loop rounds and reverts per cycle, from git and CI. Keeps a history file and applies the retro trend rule by script. No per-person metrics |
| 4.5 | `path-score.mjs` + `examples/paths/` | C14 → 5 | The path rubric as code, plus examples or evals showing that Quick keeps evidence, review and trace |
| 4.6 | Token telemetry | F32 → 2 | Reads host session usage per task into `run-ledger`. Absence is not zero: coverage is labelled complete, partial or unavailable. Reported in the PR |
| 4.7 | Evals with thresholds | F34 → 2 | Runs `evals.json` with the `skill-creator` runner in CI against a pass threshold and publishes the results. A skill that does not beat the bare model is retired |
| 4.8 | Optional: reviewers on a different model | C5 robustness | One review lens may run on a second model when the host allows it. Opt-in |
| 4.9 | Release v3.3.0 | — | — |

---

## Phase 5 · v3.4.0 "Proven" (more than 90 days; projected 100)

| # | Task | Notes |
|---|---|---|
| 5.1 | CD template with canary and metric-triggered rollback | C12 → 5; reads `## Release & observability` from the spec |
| 5.2 | Second pilot, on a different stack | Tests the non-Node path (CI gates only) |
| 5.3 | External re-score | Human or third-party scorers using the published yardstick; results published as they come |

---

## Not doing (grill Q15)

| Item | Why not |
|---|---|
| Named personas with icons, greetings and per-agent menus | Token cost on the heaviest default path; a persona that persists across stages breaks the fresh-context separation of duties. The useful part, help that reads state and recommends the next step, ships as `status.mjs` (1.3) |
| Porting the scripts to Python or .NET | It doubles maintenance. CI runs the gates for non-Node teams, and `doctor` reports `prompt-only` locally |
| A rules file without an engine | A rule with no script that runs it is a promise, not a gate |
| A minimum number of review findings | Zero findings is a valid outcome; a quota invites invented findings |
| Per-person metrics, or identity in telemetry by default | Privacy, and misuse as individual ranking |
| Branch protection on day 1 | Needs admin rights and is the most disruptive step; it stays in week 3 |

---

## Projections (hypotheses; baseline weighting)

| After | Baseline | Verdict | Confirmed by |
|---|---:|---|---|
| Today (v3.0.1) | 85.0 | First, not Superior (S4: C15) | Round 3 |
| Phase 1 (v3.1.0) | 90.0 | Superior if round 4 confirms C15 ≥ 3 | Round 4 |
| Phase 3 (v3.2.0) | 95.2 | Superior | Next re-score |
| Phase 4 (v3.3.0) | 98.8 | Superior, A4, 68/68 features | Next re-score |
| Phase 5 (v3.4.0) | 100.0 | Ceiling of the rubric | External re-score |

---

## Appendix A · Grill log

Each question was asked against the draft and answered from the code or the round-3 evidence. The answer changed the plan where marked.

| # | Question | Answer | Plan change |
|---|---|---|---|
| Q1 | Score first or a usable method first? | Usability first, score second. Tie-break: ceremony without measured benefit goes opt-in | Pilot moved from the end to Phase 2, right after v3.1 |
| Q2 | Node dependency for Python/.NET teams? | Keep Node. It is optional locally (Markdown fallback) and CI runs the gates. Node counts as a standard toolchain for the C15 anchor | Gates run in CI from day 1 (1.5); `doctor` reports `prompt-only`; no port |
| Q3 | Do day-1 gates hurt adoption? | CI jobs and CODEOWNERS on day 1 need only write access. Branch protection needs admin rights and stays in week 3 | Task 1.5 split that way; waivers for false positives |
| Q4 | Every new script adds text: won't tokens grow? | Yes, unless guarded. `budget-check` already enforces word budgets | Task 0.2: default-path token budget in CI that may never rise; rule for every PR |
| Q5 | Is round 4 by the same AI tooling credible? | It is comparable with round 3, not external | Round 4 plus an open call for external scorers at the Phase 1 exit; external re-score in Phase 5 |
| Q6 | Authority guard on 8 hosts? | Concrete controls exist for 5 in `platforms.md`. The other 3 are reported `prompt-only` | Task 3.3 scoped to 5 hosts, with explicit degradation |
| Q7 | Is the A4 runner worth L-size effort when it moves no L1 point? | Only if the pilot shows demand, and only together with the guard | 4.2 is conditional on the pilot |
| Q8 | Do day-1 gates break existing adopters (semver)? | Behaviour change with a migration path → minor | Migration section in 1.8; `doctor` flags gaps |
| Q9 | Who owns what for a solo maintainer? | Maintainer owns and reviews; one agent per task; pilot leads own metrics | Ownership line in the header |
| Q10 | How do we know it worked, beyond the score? | Pre-registered pilot thresholds | Task 2.1 |
| Q11 | What if a gate is too strict? | Use the existing waiver procedure; never delete a gate | Rollback note in 1.5 |
| Q12 | Do `status.mjs` and the router's Step 0 table drift? | They would. The data file is the source and a test compares them | Drift test in 1.3 |
| Q13 | Can extensions inject instructions? | Treated as data, repository-only, CODEOWNERS-reviewed, pinned by hash | `sha256` in the manifest, `EX06` |
| Q14 | Can an agent forge the evidence ledger? | Locally yes. CI re-runs the DoD and is the source of truth | Tamper note in 3.1; G5 protection when unattended |
| Q15 | Which market learnings are left out, and why? | Personas, quotas, rules without an engine, per-person metrics | §Not doing |
| Q16 | Hidden dependencies between tasks? | 3.3 needs 1.4; 3.1 needs 1.6; 3.2 needs 1.5 | Dependency line in Phase 3 |
| Q17 | Attribution for adapted ideas? | Describe mechanisms, never copy text; credit MIT sources in `THIRD_PARTY_NOTICES.md` when code is adapted | Applies to every task |
| Q18 | What if round 4 still scores C15 = 2? | The anchor needs a documented mechanism, not default-path use. The shipped example and validator make it hard to miss | Example extension in 1.1; worked example mentions it |
| Q19 | How are tokens measured without a non-standard tokenizer in the repo? | A chars/4 proxy in CI for the trend; tiktoken only in independent re-scores | Task 0.2 baseline table |

The grill ends when no branch is open. Remaining risks have mitigations above: pilot thresholds may be wrong (published either way), host APIs may change (`platforms.md` is the only table to edit), and the method still scores well partly because it was built against this rubric (stated in every score report).
