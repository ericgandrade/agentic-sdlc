# Agentic SDLC — Brownfield Contract

Loaded when a change touches code without tests or modernizes a component, and by the Test Engineer for `CHAR-n` tests (mechanism 14.4). Repository entry (adopt mode, code map, baseline) is `references/paths.md` §5.

Full workflow: skill `codebase-modernization`.

## 1. Characterization tests (`CHAR-n`)

| Element | Rule |
|---|---|
| **Artifact** | Test files named in the plan task's `Files`; the CHAR register in `specs/NNN-slug/current-state.md` (ID · behaviour pinned · citation · `pins bug: #n` or `—` · protects AC-n; Quick: in the PR body); the PR lists `CHAR-n` tests in their own Verification rows |
| **Trigger** | A plan task modifies a function, endpoint or job that no existing test executes (check with coverage on the touched files, or the code map `tests: []`) |
| **Output** | ≥ 1 `CHAR-n` test per touched public entry point and per edge the research found (empty, boundary, error path), committed green **before** the first production change to that code |
| **Failure behaviour** | Untested legacy code changed without CHAR tests → Reviewer **Important** finding. A CHAR test edited, deleted or skipped without an AC → **Critical** (weakening a check, `references/tdd.md` rule 6) |

Rules:

1. **A CHAR test pins current behaviour, including bugs.** Expected values are what the code returns at the base commit, never what it should return. A known defect is pinned and named: `CHAR-7 negative quantity yields negative total (pins bug #212)`; the defect gets an issue.
2. **ID format.** `CHAR-n`, unique in the repository (highest `CHAR-` in the test tree + 1), never reused; name = ID, then the observable behaviour: `CHAR-3 legacy rounding keeps half-even`.
3. **First-run pass is expected.** `references/tdd.md` rule 1 does not apply; instead mutate the pinned line once, paste the red output, revert.
4. **A CHAR test changes only with an AC or a spec revision.** The commit that changes pinned behaviour carries that AC (`Refs: Tn AC-n`), updates the CHAR test with the reason in the body, and marks the register row `superseded by AC-n`. On Quick, the acceptance test in the issue plays the AC role. No AC → the CHAR test stays as it is.
5. **Seams before tests.** No seam to observe the behaviour → add the smallest seam (parameter, constructor injection, extracted pure function) in its own behaviour-neutral commit, or report the missing seam (`NEEDS_CONTEXT` to the Planner).
6. **Synthetic inputs only.** Golden-master inputs are generated, never captured from production (`references/rules.md` rule 7).
7. **Task shape.** CHAR tests are the first commit of the task that changes the code (pinned → `AC-n` red → green). A standalone pinning task closes with `run-ledger task --no-red "characterization: CHAR-a..b"`; at most 1 per plan.

## 2. Current-state research

| Element | Rule |
|---|---|
| **Artifact** | `specs/NNN-slug/current-state.md`: questions, answers, citations, CHAR register |
| **Trigger** | Specify or Design on a module the change touches that has no current-state document newer than 90 days at the cited commit |
| **Output** | Every factual claim about the code carries a citation `path:line @ <sha>` (12-hex commit SHA); history claims `<sha> "<commit subject>"` |
| **Failure behaviour** | Uncited claim → removed or marked `unverified`; a cited line that no longer says what the claim states → `overturned`, the claim is removed before the Specify or Design sign-off request |

Rules:

1. **Question firewall.** Researchers receive factual questions only ("how does an invoice total get rounded?"), never the intended change. Intent sources (`specs/`, plans, tickets, PR text) are excluded from their reading.
2. **Read at one commit.** Reads use the recorded SHA (`git show <sha>:<path>`, `git grep <pattern> <sha>`).
3. **Verify.** A second pass re-opens every load-bearing citation and ≥ 20% of the rest; verdict per claim: verified · disputed · overturned · unverified.
4. **Freshness.** Before a sign-off request, `git diff --name-only <sha>..HEAD -- <cited paths>`; each changed path → its claims are re-verified.

## 3. Expand–contract and strangler

| Element | Rule |
|---|---|
| **Artifact** | ADR (Architect) naming the pattern; one `plan.md` task per phase; `specs/NNN-slug/migration-runbook.md` for cutover |
| **Trigger** | Changing a schema, stored format or public API, or replacing a component with live consumers |
| **Output** | Steps that each deploy and roll back alone; old and new code valid against the schema at every step |
| **Failure behaviour** | A step that changes and removes in one deploy → no Design sign-off request |

Rules:

1. **Never change in place.** Expand (additive) → migrate (dual-write, backfill in batches) → switch reads → contract (remove the old). The contract step is irreversible: its own PR, its own Release sign-off, after the bake period, with a verified backup and restore command.
2. **Strangler routing.** A facade routes traffic between old and new behind a flag; exposure follows `references/release-ops.md` (1% → 10% → 100% with their watch windows); rollback = route back to the old path.
3. **Dual-run before shift.** When outputs are comparable, run old and new on the same inputs, log mismatch counts and hashes only, never payloads; shift traffic only at a mismatch rate ≤ the spec's threshold.
4. **Retire only at zero use.** Old code is removed only after logs or metrics show zero use for the window the spec states; its CHAR tests retire with that AC.

Owners: Analyst §2 · Test Engineer, Developer §1 · Architect, Planner, Release Engineer §3.
