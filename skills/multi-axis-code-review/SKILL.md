---
name: multi-axis-code-review
description: This skill should be used when a pull request or branch diff needs an independent review against its approved spec and plan — running spec-compliance, correctness, design and simplicity, security and context-free adversarial lenses in fresh contexts, verifying every finding before a GO or NO-GO verdict, routing defects to the stage that caused them, receiving review findings as the author, re-reviewing fixes within the 3-round bound, or preparing the Test sign-off (the Test stage of the Agentic SDLC); its security lens L3 comes from security-hardening. Not for a quick generic review of a diff with no spec or plan (a plain code review such as the built-in code-review), a security-only review (use security-hardening), or checking that test evidence is fresh (use verification-gate).
license: MIT
---

# Multi-Axis Code Review

## Purpose

**Agentic SDLC · Test stage.** Used by the **Reviewer** (`../agentic-sdlc/agents/reviewer.md`); the **Security Auditor** (`../agentic-sdlc/agents/security-auditor.md`) joins on the security axis (lens L3); the **Developer** uses receive mode; a **human reviewer** (engineer, not the PR author) gives the **Test sign-off**.

Decide GO or NO-GO on a pull request from the diff and the approved artifacts, never from the PR prose. Five review axes run as four lenses in contexts that did not write the code. Every finding is checked against the code before it gets a severity, routed to the stage whose artifact caused it, and recorded in the PR `## Review triage` with one disposition. The round ends with a Review guide that lets the human reviewer sign off in minutes instead of re-reviewing from scratch.

The stage contract is `../agentic-sdlc/references/review.md` (lenses, merge key, verification results, severities, dispositions, scoped re-review, self-review fallback). This skill is the full workflow behind it and never changes its bounds. Loop bounds come from `../agentic-sdlc/references/loops.md` (3 review rounds, breaker B4 → Tech Lead); the Test sign-off record comes from `../agentic-sdlc/references/governance.md` §1; the record format is `../agentic-sdlc/templates/pr-body.md`.

## When to Use

- A PR is open, its Definition of Done (`sdlc-dod`) is green on the head commit, and it has not been reviewed at this head.
- The Developer has pushed fixes for a review round and the fixes need a scoped re-review.
- The Developer has received merged findings and must disposition them (receive mode).
- Findings from several reviewers or tools overlap and must be merged, verified and rated.
- The Test sign-off request must be prepared for the human reviewer.

Not this skill:
- Filling the Verification table, re-running DoD commands, fingerprints, CANNOT_VERIFY rows and the Trace → `verification-gate` (this skill reads its output and refuses to start on stale rows).
- Designing acceptance tests from the spec → `test-strategy` (Test Engineer).
- Threat models, the depth behind each security checklist item, secrets and supply chain procedure → `security-hardening` (the L3 lens loads its checklist).
- Finding the root cause of a failing or flaky test → `systematic-debugging`. Writing the code or the fix → `test-driven-development` and `executing-plans`.
- PR description, release notes, merge options → `shipping-and-handover`.
- Built-in platform tools named `code-review` or `security-review`: they inspect a diff for bugs without the spec, the AC trace, lens isolation, verify-then-verdict or a triage record. Their output may enter Step 5 as raw findings tagged with the lens they stand in for (for example `L4 (built-in)`); it is never a verdict and never replaces a required lens.

## Workflow

Modes: **request** (a full round, Steps 0–8 and 10), **re-review** (Step 9), **receive** (Developer side, `references/receive-mode.md`).

### Step 0 — Discover the target and check entry

1. **Pin the range.** Base = `git merge-base <target-branch> HEAD`; head = `git rev-parse HEAD`. Diff with three dots (`git diff <target>...HEAD`) so later commits on the target branch do not look reverted. A bad ref or an empty diff stops here with `NEEDS_CONTEXT`, before any lens is dispatched.
2. **Find the artifacts.** Spec folder from commit trailers (`[Tn, AC-n]`, `Refs:`), the PR body header, or the branch name matched against `specs/NNN-slug/`. Read the Path line (`Quick | Standard | Full`, S and R) from the spec header or the PR body. Quick items have no `specs/` folder: the acceptance test in the issue is the spec.
3. **Check entry conditions.** DoD green on the head commit, Verification rows fresh (fingerprint equals the current fingerprint, `../agentic-sdlc/references/verification.md` §4), Specify and Design sign-offs valid on Standard/Full (`node <scripts>/preflight.mjs` or `spec-lint --check-approval` and `plan-graph --check-approval`). Stale or missing evidence → `BLOCKED: evidence stale`; spec or acceptance tests missing → `NEEDS_CONTEXT`.
4. **Read the round count** from the PR `### Rounds` table (or the run ledger). Round 4 would be needed → stop and escalate (Step 8.4); never start a fourth round.
5. **Size the diff** without lockfiles and generated files. Over 1,000 changed lines → split the lens input by file group (each lens reads all groups in one context, in order) and add a Review guide line suggesting a split for future work. Size alone is never a finding.
6. **Run the weakened-bar scan** once (`references/weakened-bar-guard.md` §Scan). Its raw hits go into the L1 and L2 packages; the lenses judge them.

### Step 1 — Select lenses and map the five axes

| Axis | Lens | Prompt | Runs on |
|---|---|---|---|
| Spec compliance (every AC implemented, nothing outside the spec, tests prove each AC, weakened tests) | **L1** spec and tests | `prompts/axis-spec-compliance.md` | Every path |
| Correctness and edge cases | **L2** correctness and design | `prompts/axis-correctness.md` | Every path |
| Design and standards; simplicity | **L2** (same context) | `prompts/axis-design-simplicity.md` | Every path |
| Security | **L3** security (Security Auditor) | `prompts/axis-security.md` | Standard, Full; Quick with any risk trigger |
| Context-free adversarial (how does it break, from the diff alone) | **L4** | `prompts/axis-adversarial.md` | Standard, Full |

L2 is one lens: one fresh context loaded with both L2 prompts, one finding list `L2-1..n`, one checks list. Quick path runs L1 + L2 (+ L3 on a risk trigger). An extension-added lens runs only if declared in the project; it never replaces L1–L4.

### Step 2 — Build each lens package (context-free)

Each lens gets only its inputs, as file paths or pasted text, plus its prompt:

| Lens | Receives | Never receives |
|---|---|---|
| L1 | Diff, `spec.md` (or the issue acceptance test), `plan.md` task rows, `acceptance-tests.md`, Verification rows, `GLOSSARY.md`, weakened-bar scan hits on test files | Developer reasoning, chat, other lenses' findings |
| L2 | Diff, `plan.md` (signatures, Files, Impact), ADRs, `CONSTRAINTS.md` (Full), `docs/codemap.md`, AGENTS.md conventions, DoD output, scan hits on config and thresholds | Same |
| L3 | Diff, spec §Security notes, `threat-model.md` when present, secret-scan and dependency-audit output, the checklist in `../agentic-sdlc/references/security.md` §Review checklist | Same; secret values (report location only) |
| L4 | **The diff only** | Spec, plan, PR text, commit messages, any other lens's output |

Prompt hygiene before dispatch — reread every package and delete any phrase that pre-judges a finding: "do not flag", "this is intended", "at most Minor", "the plan chose", "already discussed", "ignore the", "known issue". False positives are settled in Step 6, not suppressed in the prompt. Paste rule files in full (conventions, checklist); a lens has no other access. Each lens is read-only and dispatches no helpers of its own.

Store packages in a scratch directory (`.agentic-sdlc/runs/<id>/review/round-<n>/` when a run exists, otherwise any git-ignored path) and delete it only after the triage is copied into the PR.

### Step 3 — Stage 1: L1 alone

Dispatch L1 in a fresh context (subagent, separate session, or a human). **No subagents on the platform** → run the prompt in a fresh pass after clearing working notes: the pass loads only the L1 package, and the lens row and its findings are labelled `self-review`.

Verify L1's findings at once (Step 6 procedure). L1 with ≥ 1 confirmed Critical → the round ends NO-GO with L1 findings only; it counts toward the 3-round bound; go to Step 7. Otherwise continue.

### Step 4 — Stage 2: L2, L3, L4

Dispatch all three in fresh contexts, in parallel when the platform runs concurrent subagents, else one after another. Do not read any result until all are dispatched. No subagents → three separate passes, each from a cleared context with only that lens's package, each labelled `self-review`.

Each lens returns `Ln-k · file:line-range · cause · statement · evidence · proposed: <severity>`, the list of checks performed (also when it found nothing), and a **Declined to judge** list (behaviour considered and set aside, one line each with the reason; `none` when empty).

A lens fails (error, timeout, context exhausted) → retry once in a new context. Second failure → row `lens not run: <reason>`, counted as `CANNOT_VERIFY` for that axis. `lens not run` on L1 or L3 → NO-GO until it runs or a waiver is recorded (`../agentic-sdlc/references/governance.md` §6).

### Step 5 — Merge and dedup

When every dispatched lens has returned:

1. Collect raw findings with their lens IDs; do not drop any.
2. **Dedup key:** same file, line ranges overlapping after widening each by ± 3 lines, and same cause (`spec`, `design`, `plan`, `code`, `test`, `env`) with one defect statement — two statements share a cause when fixing one fixes the other.
3. Keep one finding per collision with the highest proposed severity, every lens that raised it (`L2, L4`) and the most specific evidence. Record each collision on one line (`L3-1 + L4-2 → F-1`).
4. Number merged findings `F-1..n`. IDs are never renumbered or reused across rounds. A raw finding missing from every merged row → merge incomplete → no verdict.

Severity is not ranked across axes: each finding is rated on its own definition, and the summary names the worst finding per axis, never one overall winner.

### Step 6 — Verify, then rate

Re-check every merged finding against the code at the reviewed SHA before any severity is final (`references/triage-and-routing.md` §Verify):

- `confirmed` — a failing command output, or the cited code line plus the violated AC, rule or checklist item.
- `not reproduced` — what was tried and its result; closed, no severity.
- `declined to judge` — the reason (domain knowledge, production data, legal judgement); no severity; becomes a question in the Review guide. Every item from a lens's Declined to judge list is either verified here or recorded this way.

Only confirmed findings get a severity, from `../agentic-sdlc/references/review.md` §3:

| Severity | Definition | Effect |
|---|---|---|
| **Critical** | An AC is violated, data is lost or corrupted, a security weakness is exploitable, a secret is exposed, or the DoD is red | Blocks Test and Release sign-off; never deferred |
| **Important** | Correct today but fragile or misleading (missing negative test, test anti-pattern, design rule broken, ADR still `Proposed`, missing dependency note) | Fixed, or deferred only with owner acceptance and a follow-up issue |
| **Minor** | Readability or convention not enforced by a linter | Deferred list |

Rating rules: two severities fit → take the higher. Grade by effect on the user, not by whether the spec mentioned the case ("the spec was silent" never lowers a rating). L3 findings take the checklist's `Severity if FAIL` as the floor; shown exploitable by a command → Critical. A finding the plan itself mandates is still rated by the rubric and labelled `plan-mandated` with cause `plan`; the plan does not grade its own defects. The Reviewer never runs the full suite to verify a claim the Verification table already covers; it runs one focused command per specific doubt.

### Step 7 — Route each confirmed finding by root cause

| Cause | Typical review evidence | Route | Effect |
|---|---|---|---|
| `spec` | ACs contradict each other; an AC cannot be met as written; required behaviour is missing from the spec | Specify (Product Owner) via the change protocol (`../agentic-sdlc/references/rules.md`) | Specify sign-off void; B6 |
| `design` | The planned interface or architecture cannot satisfy the AC | Design (Tech Lead, Architect) | Design sign-off void; B6 |
| `plan` | Task order, Files or Blocked by is wrong; a `plan-mandated` defect | Design: plan amendment as a new plan revision | Design sign-off void; B6 |
| `code` | Implementation defect | Build, same task (Developer) | none |
| `test` | The test is wrong or weakened | Build, same task | none |
| `env` | Tool missing, service down, flaky infrastructure | `preflight` before the next round | none |

**Cascade:** a confirmed `spec`, `design` or `plan` finding holds every `code` and `test` finding in the same files until the ruling — the upstream fix may rewrite that code. Held findings keep their IDs and show disposition `held: F-n`. When in doubt between `plan` and `code`, choose `plan`. Routing table, ruling commands and examples: `references/triage-and-routing.md` §Route.

### Step 8 — Verdict and record

1. **Default NO-GO.** GO requires all of: every AC has a fresh passing Verification row or a waived `CANNOT_VERIFY`; the Trace has no orphans; 0 open Critical (each `fixed`, or `rejected` with the human reviewer's ruling recorded); every other confirmed finding has a disposition (Important deferred only with owner acceptance); every required lens ran or is waived.
2. **Write the PR sections** per `../agentic-sdlc/templates/pr-body.md`: Lenses table (context, every check performed, findings raised, status), Findings table (one row per F-n), Rounds row, and the GO conditions. No praise, no statements about the author's effort. "LGTM" or GO without the per-lens check list is treated as NO-GO. Without a PR host the record is `specs/NNN-slug/review.md` with the same sections.
3. **Record the round.** When a run exists (`<scripts>` = `.agentic-sdlc/bin/` when vendored, else `skills/agentic-sdlc/scripts/`; lookup order in skill `executing-plans` Step 0):
   ```bash
   node <scripts>/run-ledger.mjs round --run r1 --task PR --loop review-fix --result fail \
     --signature 'F-1 Critical export.ts:40 header injection' --cause code --tried 'as built at e55a417'
   ```
   At the Test stage the Build run is already finished; `run-ledger` accepts only `--task PR` review-fix rounds and rulings after `finish` and re-archives `specs/NNN-slug/run-ledger.jsonl` (commit it with the fix). Later rounds list the fixes in `--tried`. Without Node, add the row to `plan.md` `## Loop ledger` by hand.
4. **Bound.** Round 3 ends with a Critical open → `ESCALATE` to the Tech Lead (breaker B4) with a ruling requested on every open finding; allowed rulings `reroute`, `handover`, `drop`. `run-ledger` exits 3 at the bound. Never weaken a test, threshold or check to reach GO.
5. **Report** with the contract in `../agentic-sdlc/references/agents.md`: `DONE` verdict issued · `DONE_WITH_CONCERNS` GO with owner-accepted Important findings · `BLOCKED` evidence stale · `NEEDS_CONTEXT` spec or acceptance tests missing · `CANNOT_VERIFY` a lens did not run. The Reviewer never edits code, tests, specs or plans; a Reviewer that edits becomes an author and is replaced for that round.

### Step 9 — Scoped re-review (after fixes)

1. Input: `git diff <reviewed-sha>..HEAD` plus every finding marked `fixed`, copied verbatim.
2. Re-run each lens that raised a fixed finding on the delta only (prompt `prompts/re-review.md`), and L1 on any changed test. L4 gets the delta only.
3. The delta changes > 30% of the lines in the originally reviewed diff → full review with every lens (Steps 2–8).
4. Each fixed finding → `resolved` or `still applies` (reopens the same ID). "Attempted" is not resolved: the specific defect must be gone. New issues inside the delta get new IDs and go through Step 6 like any finding; outside the delta only an issue meeting the Critical definition is reported, marked `out of delta`.
5. Run the weakened-bar scan on the delta; a fix that loosens a test or threshold is a new finding.
6. Add the Rounds row (round, reviewed range, lenses run, findings checked, new findings, verdict). A new Critical → a new round, within the bound of 3.

### Step 10 — Prepare the Test sign-off

Only after a GO verdict (`references/test-signoff-prep.md`):

1. Fill `## Review guide`: files riskiest first with the reason; 3–7 questions tied to a file, AC or F-n, including one per `declined to judge` finding; the CANNOT_VERIFY items with verifier and date; every `self-review` label; deferred findings and waivers.
2. Request the sign-off in one message naming the role, PR, head SHA, verdict, open residual risks and the evidence reviewed. Full path: two human reviewers, at least one not involved in Design. The PR author never gives it; a 1-person team uses the waiver in `../agentic-sdlc/references/governance.md` §6.3.
3. **End the turn.** Agents never approve. A push after the request makes the request stale: the review binds to the head SHA.

## Anti-rationalization

| Thought | Reality |
|---|---|
| "No findings, so LGTM" | An empty finding list is a result only with the checks performed per lens. Without the list it is NO-GO. |
| "The PR description explains it, no need to check" | The PR text is testimony. L4 never sees it; the Reviewer verifies each claim against the code. |
| "Tell L3 the auth bypass is intended so it doesn't flag it" | Pre-judging in a prompt is the author steering the review. Remove the phrase; settle it in Step 6. |
| "L1 had a Critical, but let's run the other lenses anyway to save a round" | Quality review on code that fails its spec reviews code that will be rewritten. Stop at L1. |
| "Two lenses raised it, that's two findings" | One finding, highest severity, both lenses listed. |
| "Looks wrong, rate it Important and move on" | Unverified findings get no severity. Confirm, not reproduce, or decline to judge. |
| "The spec didn't mention empty files, so it's Minor" | Grade by effect. Data loss on an empty file is Critical whatever the spec says. |
| "The plan told the Developer to do it this way" | Label it `plan-mandated`, route it to Design. The plan does not grade itself. |
| "It's a small fix, skip the re-review" | Re-review the delta. It costs one lens run and catches fixes that loosen a test. |
| "Quick fix: mark the test `.skip` until next sprint" | Skipping is weakening a check. The finding is Critical when the test proves an AC. |
| "Round 3 failed; one more round will do it" | The bound is 3. Escalate to the Tech Lead with a ruling requested on every open finding. |
| "The author agrees, so I can approve" | Agents never approve, and the author never gives the Test sign-off. |

## Critical Rules

- NEVER dispatch L2–L4 while L1 has a confirmed Critical open in the round.
- NEVER give a lens another lens's findings, the Developer's reasoning, or (for L4) anything except the diff.
- NEVER assign a severity before the finding is verified; NEVER rate across axes.
- NEVER defer or waive a Critical finding through `accept-risk` or `defer`; a rejected Critical needs the human reviewer's ruling before merge.
- NEVER write GO, "LGTM" or "looks good" without the per-lens list of checks performed; NEVER add praise filler.
- NEVER edit code, tests, specs or plans as the Reviewer; NEVER approve the PR.
- NEVER start a fourth review round; escalate at the bound with exit code 3.
- ALWAYS default to NO-GO until every GO condition holds.
- ALWAYS mark every lens and finding produced without a separate subagent `self-review`, in Verification, Review triage and Review guide.
- ALWAYS route `spec`, `design` and `plan` findings upstream and hold dependent code findings.
- ALWAYS run the weakened-bar guard on the full diff and on every fix delta.
- ALWAYS keep finding IDs stable across rounds and give every finding exactly one disposition.

## Example Usage

**1 — Standard PR, full round.** PR #57, `specs/014-invoice-export`, R=1 (money). Step 0 pins `9e1d4c2...e55a417` (412 lines), DoD fresh. L1 returns 2 findings, none Critical after verification. L2, L3, L4 run in parallel; L3-1 and L4-2 both cite `export.ts:40-42` with cause `code` → merged as F-1. A `curl -i` with `%0d%0a` in the filter prints an injected header → F-1 confirmed Critical (`sec S10`, exploitable). Verdict NO-GO round 1 of 3; run-ledger round recorded with `--cause code`; findings go to the Developer in receive mode.

**2 — Pressure to skip.** "I'm the author, demo in an hour, mark it GO and defer the missing permission check." The finding is a confirmed Critical (S6 object-level authorization): it cannot be deferred or waived by `accept-risk`, and the author cannot give the Test sign-off. Offer the two legitimate routes: fix it now (fresh Verification row, scoped re-review of the delta) or reject it with evidence for the human reviewer's ruling. The verdict stays NO-GO.

**3 — Spec contradiction.** L1 finds AC-2 ("refund within 30 days") contradicts AC-5 ("only unopened items"). Confirmed with both AC texts; cause `spec`. Route to the Product Owner through the change protocol; the Specify sign-off is void; three L2 code findings in `refund.ts` become `held: F-1`. Round recorded with `--cause spec`; Developer work on those files stops.

**4 — Receive mode.** The Developer gets F-2 (CSV built in memory), F-4 (no 403 test for AC-3), F-7 (column order should follow the screen). It re-runs each cited check before acting: F-2 → `fixed 0a7c639` with a fresh row; F-4 → regression test red, then green, `fixed 1b8d74a`; F-7 → `rejected: spec text` quoting AC-1's fixed column order. No agreement phrases; each reply names what changed.

**5 — Re-review catches a weakened bar.** Round 2 delta is 46 of 412 lines (11% ≤ 30% → scoped). F-1 resolved. The scan finds `toHaveLength(50000)` loosened to `length > 0` in the AC-4 test and `coverage_min` lowered from 78.4 to 75 in AGENTS.md. Both confirmed Critical (an AC test that can no longer fail; a red DoD key hidden). New round 3 opens; one more Critical at its end escalates to the Tech Lead.

## References

| File | Load when |
|---|---|
| `prompts/axis-spec-compliance.md` | Step 3: building the L1 package |
| `prompts/axis-correctness.md` | Step 4: building the L2 package (first half) |
| `prompts/axis-design-simplicity.md` | Step 4: building the L2 package (second half, same context) |
| `prompts/axis-security.md` | Step 4: building the L3 package for the Security Auditor |
| `prompts/axis-adversarial.md` | Step 4: building the L4 package (diff only) |
| `prompts/re-review.md` | Step 9: scoped re-review of a fix delta |
| `references/triage-and-routing.md` | Steps 5–8: merging, verification methods, rating examples, routing and the cascade, record formats |
| `references/weakened-bar-guard.md` | Step 0.6 and Step 9.5: scan commands, legitimacy test, severities |
| `references/receive-mode.md` | Developer receiving findings; disputes; rejected Critical rulings |
| `references/test-signoff-prep.md` | Step 10: Review guide, risk ordering, question writing, the sign-off request |
| `../agentic-sdlc/references/review.md` | Contract check whenever a bound, format or severity is in doubt |
| `../agentic-sdlc/references/security.md` §Review checklist | L3 package |
