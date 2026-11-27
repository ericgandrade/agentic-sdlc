# Help topics

Short answers printed by `status.mjs --topic <name>`. Each topic is at most 150 words and points to the file that holds the rule.

## blocked

An agent reported `BLOCKED` or `NEEDS_CONTEXT`. Read its status line: it names the missing input or the failed check. Record it in `specs/NNN-slug/impediments.md` (`IMP-n`, blocker, owner, unblock condition). A failed gate is never skipped: fix the cause, or ask for a waiver (owner ≠ requester, reason, expiry ≤ 30 days, follow-up issue, `references/governance.md`). A loop at its bound escalates with a ruling requested on every open item (`references/loops.md`). Then run `status.mjs` again.

## resume

Run `status.mjs`. It reads `specs/`, the approvals, the plan, the commits and the run ledgers, and names the state with its evidence. Confirm the resume in one line ("Resume Build at T6?") and end the turn. A `specs/NNN-slug/handoff.md` holds the pointer when context was cleared mid-stage (`references/phase-boundaries.md` §Handoff).

## path

The path is the higher of size and risk (`references/paths.md` §Score). Size S = files + components + iterations: S ≤ 4 Quick, 5–6 Standard, ≥ 7 Full. Risk R counts triggers (auth, personal or health data, money, public API, schema, irreversible, regulated): R = 0 Quick, 1 Standard, ≥ 2 Full. Missing inputs → Standard. During Build, more files than the bound or a new trigger → re-score and route up; never down silently.

## approvals

A sign-off counts only when a named person says "yes" or "approved" in a later turn. Record role, person, exact words, revision and the 12-hex hash of the artifact (`references/governance.md`). Any later edit changes the hash and voids the approval: use the change protocol (`references/rules.md`). `spec-lint --check-approval` and `plan-graph --check-approval` verify the binding.

## extensions

Extensions add review lenses, DoD checks or templates without forking the method (`references/extension-interface.md`). They live in `.agentic-sdlc/extensions/<name>/` with an `extension.json` pinned by SHA-256. Run `ext-check --json` to list the valid ones per extension point. Exit ≠ 0 → load none of the refused ones and record `extension refused: <rule>` in the PR body.
