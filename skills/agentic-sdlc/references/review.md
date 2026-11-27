# Review — Lenses, Triage and Receive Mode

Load this file in the Test stage (Reviewer) and whenever a Developer receives review findings. It defines how a pull request is examined in independent contexts, how findings are merged, verified, rated and dispositioned, and how fixes are re-reviewed. Evidence rules live in `references/verification.md`; the record format lives in `templates/pr-body.md` §Review triage; security check content lives in `references/security.md` §Review checklist.

Full workflow: skill `multi-axis-code-review`.

**Order.** Each review round runs in two stages:

1. **Spec compliance** (lens L1, alone): does the diff do what the approved spec asks, all of it and nothing more, with tests that prove each AC?
2. **Quality** (lenses L2, L3, L4, in parallel): is the change correct, well designed, secure and robust?

Stage 2 is dispatched only when L1 returns 0 confirmed Critical findings. L1 with ≥ 1 confirmed Critical → the round ends NO-GO with the L1 findings only; the round counts toward the 3-round bound.

## 1. Lenses

| Lens | Axis | Receives | Checks (each one is listed as performed or not in the triage) | Runs on |
|---|---|---|---|---|
| **L1** | Spec and tests | Diff, `spec.md`, `plan.md`, `acceptance-tests.md`, Verification rows | Every AC implemented; no behaviour outside the spec or its non-goals; each AC test asserts the stated outcome; negative test present for input, permission and limit ACs; tests against `references/tdd.md` §3 Anti-pattern catalogue; Trace has no orphans | Every path |
| **L2** | Correctness and design | Diff, `plan.md`, ADRs, `CONSTRAINTS.md` (Full), code map | Logic and edge cases (empty, max, concurrent, error paths); interface matches the plan signature; no abstraction with < 2 call sites; error handling and logging; ADR status `Accepted`; DoD output re-read for warnings | Every path |
| **L3** | Security | Diff, spec Security notes, threat model (when present) | The 20-item checklist in `references/security.md` §Review checklist; secrets, input handling, authz, dependency notes (rule 10); findings tagged `sec` with the item ID (`sec S10`) | Standard, Full; a Quick PR with any risk trigger |
| **L4** | Context-free adversarial | **The diff only**: no spec, no plan, no PR text | "How does this break?": hostile input, resource exhaustion, race, partial failure, wrong assumption visible in the diff itself | Standard, Full |

Quick path: L1 + L2 (+ L3 with a risk trigger).

<!-- ext:review.lenses --> Extension lenses: `ext-check --point review.lenses --json`; each runs after L1–L4 as one more lens and never replaces one.

Rules:

1. One fresh context per lens. L2–L4 are dispatched in parallel when the platform runs concurrent subagents, else one after another. A lens context never receives another lens's findings or the Developer's reasoning.
2. Each lens returns findings as `Ln-k · file:line-range · cause · statement · evidence · proposed: <severity>` and its list of checks performed. A lens that reports zero findings still lists every check it performed.
3. A lens fails to run (error, timeout, context exhausted) → retry once in a new context. Second failure → record `lens not run` with the reason; that axis counts as `CANNOT_VERIFY`. A `lens not run` on L1 or L3 → NO-GO until the lens runs or a waiver is recorded (`references/governance.md` §Waivers).

## 2. Merge and dedup

Trigger: all lenses dispatched in the round have returned (L1 alone when stage 2 was not dispatched).

1. **Dedup key:** same file **and** line ranges that overlap after widening each by ± 3 lines **and** same cause. Cause ∈ {spec, design, plan, code, test, env} (`references/loops.md` §Routing) plus a one-line defect statement; two statements share a cause when fixing one fixes the other.
2. **Collision:** keep one finding, the highest proposed severity, and list every lens that raised it (`L2, L4`). Keep the most specific evidence.
3. **IDs:** merged findings are numbered `F-1..n`; an ID never changes or gets reused across rounds. Each collision is recorded in one line under the Lenses table (`L3-1 + L4-2 → F-1`).
4. **Output:** the merged list in `## Review triage`. A finding that appears in no merged row → merge is incomplete → no verdict.

## 3. Verify, then rate

Trigger: after merge, before any severity is final. The Reviewer re-checks each merged finding against the code at the reviewed SHA:

| Result | Requires | Effect |
|---|---|---|
| `confirmed` | A failing command output, **or** the cited code line plus the violated AC, rule or checklist item | Gets a severity; enters the disposition flow |
| `not reproduced` | What was tried (command or reading) and its result | Closed; no severity; stays in the log |
| `declined to judge` | The reason (domain knowledge, production data, legal judgement) | No severity; becomes a question in `## Review guide` for the human reviewer |

Only `confirmed` findings get a severity:

| Severity | Definition | Examples | Effect |
|---|---|---|---|
| **Critical** | An AC is violated, data is lost or corrupted, a security weakness is exploitable, a secret is exposed, or a DoD command fails (a coverage value below `coverage_min` alone is Important and may take an `accept-risk` waiver, `references/governance.md` §6) | Formula injection unescaped; permission check missing; totals rounded wrongly | Blocks Test and Release sign-off; never deferred |
| **Important** | Correct today but fragile or misleading: missing negative test, test anti-pattern, design rule broken, ADR still `Proposed`, missing dependency note | Mocked internal collaborator; unbounded memory on a bounded input | Fixed, or deferred only with owner acceptance and a follow-up issue |
| **Minor** | Readability or convention not enforced by a linter | Naming, comment wording | Deferred list, triaged at the end |

Tie-break: when two severities fit, take the higher one. For an L3 finding, the `Severity if FAIL` column of `references/security.md` §Review checklist is the floor; a weakness shown exploitable by a command raises it to Critical. Severity is not ranked across axes; each finding is rated on its own definition.

## 4. Verdict — reviewer side

- **Default NO-GO.** GO requires all of: every AC has a fresh passing row (`evidence check` exit 0) or a waived `CANNOT_VERIFY` (`references/verification.md`); the Trace has no orphans (`trace-check` exit 0); 0 open Critical findings (each Critical is `fixed`, or `rejected` with the human reviewer's ruling recorded); every other confirmed finding has a disposition (an Important `deferred` only with owner acceptance); every required lens ran or is waived; the repository's CI checks (`agentic-sdlc/dod`, `spec`, `approvals`, `trace`, `secret-scan`, `dependency-audit`) are green on the reviewed SHA, or waived.
- **No bare approval.** "LGTM", "looks good" or GO is written only together with the list of checks performed per lens. A GO without that list is treated as NO-GO.
- **No praise filler.** The triage holds findings, checks and evidence. Statements about effort or quality of the author do not appear.
- **Never fix.** The Reviewer reports; the Developer fixes. A Reviewer that edits code becomes an author and is replaced by a fresh Reviewer for that round.

## 5. Receive mode — developer side

Trigger: the Developer receives the merged, confirmed findings. Procedure for each finding, in severity order:

1. Read the cited code and re-run the cited command before acting. Agreement without this check is forbidden, and so is a reply of agreement written before the check.
2. Decide and record one disposition:

| Disposition | Requires | Allowed for |
|---|---|---|
| `fixed <sha>` | The fix commit (`Refs: Tn F-k`, plus the AC-n it serves) and a fresh Verification row on the new fingerprint | Any severity |
| `rejected <evidence>` | Command output, spec text or code reference showing the finding is wrong | Any severity; a rejected Critical goes to the human reviewer for a ruling before merge |
| `deferred <issue>` | A follow-up issue; for Important, the owner's acceptance in their exact words | Minor; Important with owner acceptance; **never Critical** |

3. A finding that is unclear → ask the Reviewer one question; do not guess.
4. Report status `DONE` only when every finding has a disposition; an empty disposition → `BLOCKED: triage incomplete`.

## 6. Scoped re-review

Trigger: the Developer reports fixes for a round.

1. Input: `git diff <reviewed-sha>..HEAD` plus every finding marked `fixed`.
2. Re-run each lens that raised a fixed finding, on the delta only, and L1 on any changed test. L4 receives the delta only.
3. The delta changes > 30% of the lines in the originally reviewed diff → full review with every lens.
4. Check each fixed finding: `resolved` or `still applies` (the latter reopens it with the same ID).
5. Record a row in the Rounds table: round, reviewed SHA range, lenses run, findings checked, new findings, verdict.
6. A new Critical finding in a re-review → a new round. Round 4 needed → `ESCALATE` to the Tech Lead with a ruling requested on every open finding (`references/loops.md`, 3 review rounds).

## 7. Independence and the self-review fallback

The Reviewer and every lens run in contexts that did not author the change (separate subagent, separate session, or a human). The Developer never reviews its own diff.

No subagents on the platform → run each lens as a separate pass from a cleared context loaded with only that lens's inputs (§1). Mark each such lens row and finding `self-review`; the label is mandatory in `## Verification`, `## Review triage` and `## Review guide`. On the Full path, the second human reviewer reads the self-review lenses as review-guide items and records their own check.

Without a PR host, the review record is `specs/NNN-slug/review.md` (Quick: `docs/reviews/<issue>.md`) on the feature branch, with the same sections; the Test sign-off is its `## Test sign-off` row (`templates/pr-body.md`).

## Red flags

The left column quotes rationalizations; the quoted words are what to catch, not guidance.

| Thought | Reality |
|---|---|
| "No findings, so LGTM" | List the checks performed per lens; an empty list is not a review. |
| "The reviewer said so, I'll change it" | Verify the finding first; reject with evidence when it is wrong. |
| "This Critical can go in the next PR" | Critical is never deferred. Fix it or get a human ruling. |
| "The fix was small, skip the re-review" | Re-review the delta. It costs one lens run. |
| "Two lenses raised it, so it counts twice" | Merge it: one finding, highest severity, both lenses listed. |

## Sources

Parallel context-free lenses, verify-then-verdict and the triage log adapt BMad Method (MIT) review practice; two-stage spec-then-quality review and receive-side verification adapt Superpowers' (MIT) requesting- and receiving-code-review skills; the severity labels follow Addy Osmani's agent-skills (MIT) code-review practice. All text is original.
