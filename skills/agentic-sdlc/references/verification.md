# Verification — Evidence, Independence and Trace

Load this file for any completion claim (task, PR, release), when the Test Engineer designs acceptance tests, and when the Reviewer fills the PR sections `## Verification` and `## Trace`. It implements rules 2, 5 and 8 of `references/rules.md`. Record formats live in `templates/pr-body.md` and `templates/acceptance-tests.md`; this file holds the decision rules.

Full workflow: skills `verification-gate` (completion claims) and `test-strategy` (acceptance-test design).

The Definition of Done (the `sdlc-dod` block in AGENTS.md: lint, typecheck, test, coverage) and the acceptance criteria (`AC-n` in `spec.md`, or in the issue on the Quick path) are **separate checks**. A green DoD never proves an AC, and a passing AC test never replaces the DoD.

## 1. Verification gate

| Element | Rule |
|---|---|
| Artifact | PR `## Verification` table (`templates/pr-body.md`); without a PR host, `specs/NNN-slug/review.md` with the same table |
| Trigger | Every completion claim: "done", "fixed", "passing", "works", "ready for review", "ready to release" |
| Rule | The claim carries output of the DoD commands **and** the AC test commands, run after the last change to the working tree, with the fingerprint (§4) of the tree they ran on |
| Output | One row per command: `ID · test · command · exit · fingerprint · time · by`; the last ≤ 40 output lines of each command in the collapsed excerpt block under the table |
| Failure | A required row missing, non-zero, or stale (§4) → the claim is withdrawn, the agent status is `BLOCKED`, and the work is not done |

What each claim needs:

| Claim | By | DoD rows | AC rows |
|---|---|---|---|
| Task Tn done | Developer | All `sdlc-dod` keys | The ACs listed on the task row in `plan.md` |
| PR ready for review | Developer | All `sdlc-dod` keys | Every AC of the spec (Quick: every AC in the issue) |
| GO verdict | Reviewer (re-runs; never copies the Developer's rows) | All `sdlc-dod` keys | Every AC, plus every acceptance test in `acceptance-tests.md` |
| Release GO | Release Engineer | All `sdlc-dod` keys on the release commit | Every AC on the release commit's fingerprint, plus the rollback rehearsal (`references/release-ops.md` §Go/no-go) |

Decision rules:

1. A row counts only when `exit = 0` and its fingerprint equals the current fingerprint. Exit codes are copied from the shell, never typed from memory.
2. A DoD key written as `<key>: n/a — <reason>` in `sdlc-dod` gets a row with `exit = n/a` and the reason; any other blank cell is a missing row.
3. `coverage` passes only when the measured value is ≥ `coverage_min`; write the measured value in the `exit` cell as `0 (81.2 ≥ 78.4)`. Below the floor the row fails even when the tool exits 0: write `0 (76.2 < 78.4) — below floor`.
4. Every AC has ≥ 1 row. An AC with no runnable test is either `CANNOT_VERIFY` (§3) or a gap that returns to the Test Engineer.
5. The Reviewer re-runs every command; a row whose `by` column names the Developer is testimony and does not count toward GO.
6. <!-- ext:dod.checks --> Extension DoD checks (`ext-check --point dod.checks --json`) are DoD rows like the `sdlc-dod` keys.

## 2. Independent test design

| Element | Rule |
|---|---|
| Artifact | `specs/NNN-slug/acceptance-tests.md` (`templates/acceptance-tests.md`); test files named with their AC ID |
| Trigger | Design sign-off (Standard/Full); the Quick-path acceptance test is written in the issue before any code |
| Rule | The Test Engineer (`agents/test-engineer.md`) derives each test from the approved spec in a context that has never seen the implementation diff, the branch or the PR text. It reads code only at the base commit |
| Output | AC-n → test ID map, level, failure caught, criticality, red output at the base commit, green output at the PR head |
| Failure | The designer received the diff, branch or PR text → `BLOCKED: context contaminated`; a fresh Test Engineer redoes the design and the contaminated file is replaced |

Procedure:

1. Copy the spec revision and its 12-hex hash into the file header. A later spec revision voids the map; re-derive the rows for every changed AC.
2. For each AC, choose the lowest test level that observes the outcome (unit < integration < end-to-end) and write the failure the test catches in one sentence.
3. Add ≥ 1 negative test for every AC that handles input, permissions or limits.
4. Run each test at the base commit. It must fail; a test that passes at the base proves nothing → rewrite it before Build starts.
5. In the Test stage, run every acceptance test at the PR head and add its row to `## Verification`.

**Where the tests live during Build.** They are red until the feature exists, and the `sdlc-dod` baseline and every task need a green tree. So they are committed on `at/NNN-slug`, cut from the base commit, together with `specs/NNN-slug/acceptance-tests.md` whose "Red at the base commit" rows are filled before that commit (`test: add acceptance tests for <NNN-slug>`, trailer `Refs: AC-1 … AC-n`), and stay off the feature branch during Build. The session controller does this branch work, never the Developer. In the Test stage:

1. In a disposable worktree at the feature-branch head, merge `at/NNN-slug` and run the acceptance tests.
2. Red → a finding routed by cause. Fix on the feature branch, which stays without the red tests, and repeat step 1.
3. Green → merge `at/NNN-slug` into the feature branch with `--no-ff` (`test: merge acceptance tests for <NNN-slug>`, trailer `Refs: AC-1 … AC-n`; an artifact commit for Trace, §5); that head is the PR head that step 5 records, and Build-time Verification rows are re-run there.

The Developer never edits a test listed in `acceptance-tests.md`. An acceptance test that disagrees with the implementation is a finding for the Reviewer, routed by cause (spec, design or code), never a test to relax.

**Verdict source.** The Reviewer judges from the diff, the artifacts and commands it re-ran. The PR description and the Developer's report are claims to check, never evidence.

**Fallback without subagents.** Run the test design in a separate pass that starts from a cleared context loaded with only the spec and the base-commit code. Write `designed by: self-review` in the acceptance-tests header; the label is mandatory in the PR `## Verification` and `## Review guide` sections. On the Full path, a self-review test design is presented to the second human reviewer as a review-guide question.

## 3. CANNOT_VERIFY

| Element | Rule |
|---|---|
| Artifact | PR `## Verification` → `CANNOT_VERIFY` table; `acceptance-tests.md` → `## Not verifiable before release` |
| Trigger | An AC that cannot be exercised before merge: production-only data or volume, a third-party system without a sandbox, physical hardware, a legal or human judgement |
| Rule | Record `AC-n · reason · what was checked instead · verifier (role + person) · when (date or event, ≤ 14 days after release) · Critical? · waiver ID`. "Not run" without a reason is a missing row, not `CANNOT_VERIFY` |
| Output | The table row, repeated as an item in `## Review guide`, and as a post-release check in the release notes |
| Failure | ≥ 1 `CANNOT_VERIFY` on a Critical AC → Test sign-off requires an explicit waiver (`references/governance.md` §Waivers: owner ≠ requester, reason, expiry ≤ 30 days, follow-up issue). More than half of the ACs `CANNOT_VERIFY` → NO-GO and return to Design for test seams |

**Critical AC.** An AC is Critical when its `Priority` in `spec.md` is `critical`; the Test Engineer copies it into the `Critical` column of `acceptance-tests.md`. Every AC that touches a risk trigger (auth, personal/health data, money, public API, schema/migration, irreversible, regulated) or a spec Security note must be `critical`; one marked `normal` → L1 Important finding, cause `spec`.

A silent pass is forbidden: a check that did not run is reported as `CANNOT_VERIFY`, never left out. Agents use the same status in their report (`references/agents.md` §Report contract).

## 4. Evidence records and staleness

**Fingerprint.** SHA-256 over the index (`git ls-files -s`) plus the content hash of every modified or untracked file, excluding `.agentic-sdlc/evidence/**`, `.agentic-sdlc/doctor.json`, `docs/reviews/**` and the record files under `specs/*/` (`review.md`, `approvals.md`, `run-ledger.jsonl`, `handoff.md`, `impediments.md`, `release-notes.md`); `spec.md`, `plan.md` (read without its `## Loop ledger` rows, like the plan hash) and `acceptance-tests.md` still count, because editing them voids a sign-off. Recorded as the first 12 hex characters. Equal fingerprints mean the tested tree is byte-identical. `node scripts/lib/git.mjs fingerprint` prints it.

**Manual procedure (applies whenever `scripts/evidence.mjs`† is absent from the installed version):**

1. Compute the fingerprint immediately before running the commands: `node <skill-dir>/scripts/lib/git.mjs fingerprint` (any OS).
2. Run `dod-gate` for the DoD rows (it records exit, output hash and fingerprint; `dod-gate check` exit 1 = red or stale) and each AC command; copy the exit code and the last ≤ 40 output lines.
3. Compute the fingerprint again. Different from step 1 → the tree changed during the run → discard the rows and repeat.
4. Write the rows with the fingerprint and the ISO-8601 time.
5. Node absent → commit first; the tree must be clean (`git status --porcelain` prints nothing); record `head:<first 12 hex of git rev-parse HEAD>` as the fingerprint.

**Staleness rule.** A row is **stale** when its fingerprint differs from the current fingerprint, when the fingerprint cell is empty or unknown, or when a `head:` row was recorded and the tree is now dirty. Stale → re-run; a stale row never counts.

**When to check staleness:** before every completion claim; before the Reviewer issues GO; before the Test sign-off request; after any commit, rebase or merge from the base branch; before the Release sign-off request.

**Persistence.** The PR body is the record at this tier. Without a PR host the same table lives in `specs/NNN-slug/review.md` (Quick: `docs/reviews/<issue>.md`), committed on the feature branch. `scripts/evidence.mjs record|check`† writes `.agentic-sdlc/evidence/ledger.jsonl` (cmd, exit, stdout sha256, last 40 lines, fingerprint, time) and renders the same table; when present, it replaces steps 1–5 and its `check` exit 1 is a Reviewer NO-GO.

## 5. Trace — two-way gap analysis

| Element | Rule |
|---|---|
| Artifact | PR `## Trace` matrix and `Orphans` list (`templates/pr-body.md`) |
| Trigger | Before the Reviewer issues GO; repeated before the Test sign-off request when commits were added |
| Rule | Forward: every AC has ≥ 1 task and ≥ 1 test with a fresh passing row (or a waived `CANNOT_VERIFY`). Backward: every task names ≥ 1 AC; every code commit on the branch names ≥ 1 Tn; every AC ID cited in a task, commit or test exists in the spec |
| Output | One matrix row per AC: `AC-n · tasks · commits · tests · Verification rows · status`; an `Orphans` list (`none` when empty) |
| Failure | Any orphan → NO-GO until resolved as below |

Manual procedure (applies whenever `scripts/trace-check.mjs`† is absent):

1. ACs: the `AC-n` IDs in `spec.md` (Quick: in the issue).
2. Tasks: the `## Tasks` rows of `plan.md` and their AC column.
3. Commits: `git log --format='%h%x09%s%x09%(trailers:key=Refs,valueonly,separator=%x20)' <base>..HEAD`; the bracket form `[T3, AC-2]` in the subject also counts. **Artifact commits are exempt from the Tn rule:** a `docs:`, `chore:` or `test:` commit whose files are all method artifacts (`docs/issues/**`, `docs/reviews/**`, `specs/NNN-slug/**`, `.agentic-sdlc/runs/**`; never `.agentic-sdlc/bin/` or `config.json`, which change the gates) or acceptance-test files listed in `acceptance-tests.md`. Examples: issue, spec, approval register, threat model, acceptance tests (`Refs: AC-n`), `chore: archive run ledger r1`, review record. List them in the matrix as `artifact`; a commit that also touches other files is a code commit.
4. Tests: search the test directories for `AC-[0-9]+` in test names; match each to its Verification row.
5. Fill the matrix; list every orphan with its kind.

| Orphan | Resolution |
|---|---|
| AC without a task | Back to Design: add the task; Design sign-off re-opens |
| AC without a passing test | Back to the Test Engineer for the test, then a fresh row |
| Task without an AC | Remove the task, or run the change protocol (`references/rules.md`) to add the AC |
| Code commit without a Tn | Reword the commit on the feature branch before merge (`git rebase -i <base>`, `reword`); the default branch is never rewritten |
| Changed file or behaviour that no task and no AC asks for | L1 Important finding: remove it, or run the change protocol to add the AC and the task |
| Unknown AC ID in a task, commit or test | Fix the reference; an ID cited with no spec AC behind it is scope outside the approved spec → L1 Important finding |

**Quick path.** No `plan.md`: commits carry `Refs: AC-n`, and the task checks are recorded as `n/a — Quick`. Every other check applies.

`scripts/trace-check.mjs`† performs steps 1–5 from the files and `git log`, writes `specs/NNN-slug/trace.md` and exits 1 listing the orphans; when present, its output replaces the manual matrix.

## Red flags

The left column quotes rationalizations; the quoted words are what to catch, not guidance.

| Thought | Reality |
|---|---|
| "The tests passed earlier" | Earlier is a different fingerprint. Re-run. |
| "The Developer pasted the output already" | Testimony. The Reviewer re-runs every command. |
| "It cannot be tested locally, so skip the row" | Write a `CANNOT_VERIFY` row: reason, verifier, date. |
| "CI is green, that covers the ACs" | CI runs the DoD. Each AC needs its own test row. |
| "Only a comment changed since the run" | Any change moves the fingerprint. Re-run. |
| "I'll write the acceptance test after seeing the code" | Tests designed from the code check what was built, not what was asked. |

† Added in a later release; manual fallback in `references/artifacts.md` §Later-release files.

## Sources

Fresh-evidence-before-claims adapts Superpowers' (MIT) verification-before-completion skill; the independent verifier and the cannot-verify status follow concepts from Agile V (CC BY-SA, concepts only); fingerprint-bound staleness follows the ai-dlc evidence pattern. All text is original.
