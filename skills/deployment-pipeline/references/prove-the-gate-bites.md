# Prove each gate bites

Load in Step 5. A gate counts as enforced only when a deliberately bad change was **blocked by the host**, not when the workflow file looks right. Contract: `../../agentic-sdlc/references/governance.md` §7; evidence format: `../../agentic-sdlc/references/verification.md`.

## 1. Procedure

1. Start from the default branch with the workflow and protection already applied.
2. For each case below: branch `gate-proof/<gate>-<case>`, one commit with the bad change, open a **draft** PR titled `[gate-proof] <gate> <case>` with the body line `Do not merge — gate proof for <setup PR link>`.
3. Wait for the checks. Draft PRs report `mergeStateStatus: DRAFT`; mark the PR ready (`gh pr ready <n>`) to read the real merge state, read it, then close.
4. Read the evidence — never try to merge to "see what happens" (if the gate is broken, the bad change lands):

```bash
gh pr view <n> --json number,url,mergeStateStatus,reviewDecision,statusCheckRollup \
  --jq '{n: .number, url, merge: .mergeStateStatus, review: .reviewDecision,
         checks: [.statusCheckRollup[] | select(.name // .context | startswith("agentic-sdlc")) | {name: (.name // .context), conclusion: (.conclusion // .state)}]}'
gh pr close <n> --delete-branch --comment "gate proof recorded in <setup PR link>"
```

GitLab: `glab mr view <iid> -F json` (fields `detailed_merge_status`, `head_pipeline.status`); expected `ci_must_pass` or `not_approved` for blocked. Azure DevOps: `az repos pr show --id <n> --query "{status: mergeStatus, policies: status}"` plus `az repos pr policy list --id <n>`.

5. Revert the bad change on the same branch (clean control) before closing when the case says so; record both rows.
6. Close every proof PR within 24 h; delete the branch.

## 2. Case catalog

`Expected merge` for a violation is `BLOCKED`. For the clean control, `BLOCKED` caused only by the review requirement is fine; the check must be green.

| Gate | Case | Bad change | Expected check | Expected merge |
|---|---|---|---|---|
| dod | lint | Add an unused variable or a rule the linter rejects | red at `lint` | BLOCKED |
| dod | typecheck | Assign a string to a typed number | red at `typecheck` | BLOCKED |
| dod | test | New test asserting `1 === 2` | red at `test` | BLOCKED |
| dod | coverage floor | Add an untested module large enough to drop line coverage below `coverage_min` | red at the floor step, measured value printed | BLOCKED |
| dod | self-weakening | In the same PR, change the `sdlc-dod` test command to `true` and add a failing test | red (block read from the base branch) | BLOCKED |
| dod | tool error | Point `COVERAGE_SUMMARY` at a missing path, or delete the coverage reporter config | red ("fails closed") | BLOCKED |
| dod | missing key | Remove a key from a copy of the block | red, `missing` | proven locally — the PR cannot change the base block; run the step script against the edited copy and record `local` |
| spec | edited after approval | Change one number in an approved `spec.md` | red, `ERROR AP04` | BLOCKED |
| spec | expired waiver | Set a waiver `Expires` in the past | red, `WV05` (error under `--check-approval`) | BLOCKED |
| spec | checker tampering | Replace `.agentic-sdlc/bin/spec-lint.mjs` with `process.exit(0)` and edit the spec | red (checkers run from the base branch) **and** CODEOWNERS review requested | BLOCKED |
| spec | named, not touched | Code-only PR whose body `Spec:` line names a spec with a void approval | red | BLOCKED |
| approvals | plan stale | Edit `plan.md` without regenerating `graph.json` | red, `GRAPH_STALE` | BLOCKED |
| approvals | spec void | Same edit as `spec / edited after approval` | red, `APPROVAL_SPEC_VOID` | BLOCKED |
| trace | gap | AC without a test row in `acceptance-tests.md` (TR07) | red | BLOCKED |
| host | workflow edit | Change `agentic-sdlc.yml` so a job always passes | may be green — the workflow runs from the PR head | BLOCKED, `reviewDecision: REVIEW_REQUIRED` from a code owner |
| host | code owner | Approve a `specs/**` change with a non-owner account | — | BLOCKED |
| host | stale review | Approve, then push one more commit | — | BLOCKED, approval dismissed |
| host | last push | The approver pushes the last commit and approves | — | BLOCKED |
| host | admin bypass | Read config only: `enforce_admins.enabled` true or ruleset `bypass_actors` empty | — | config row |
| host | force push | Read config only: `allow_force_pushes.enabled` false or `non_fast_forward` rule present | — | config row |
| host | production approval | Dispatch the deploy workflow with the tag already in production | run `waiting`; requester cannot approve (`pending_deployments[].current_user_can_approve` false) | cancel the run |

Admin bypass and force push are proven from configuration because a real attempt would rewrite the default branch if the control were missing.

Production approval evidence:

```bash
gh run list --workflow deploy --limit 1 --json databaseId,status --jq '.[0]'
gh api "repos/{owner}/{repo}/actions/runs/<run-id>/pending_deployments" \
  --jq '.[] | {env: .environment.name, can_approve: .current_user_can_approve, reviewers: [.reviewers[].reviewer | .login // .slug]}'
gh run cancel <run-id>
```

## 3. Evidence rows

Paste into the setup PR's `## Verification` table:

| ID | Change | Expected | Observed | Merge state | Link | Date | By |
|---|---|---|---|---|---|---|---|
| Gate:spec:edited-after-approval | `specs/001-csv-export/spec.md` "50,000" → "60,000" | red, AP04 | `ERROR AP04: approval void: recorded hash 6b4c7f329c93 ≠ current 3ea37aa6f000` · exit 1 | BLOCKED | #<n> | 2026-11-24 | Release Engineer (gate-attacker: subagent) |
| Gate:approvals:spec-void | same | red, APPROVAL_SPEC_VOID | `FAIL APPROVAL_SPEC_VOID: … spec hash 6b4c7f329c93 ≠ current 3ea37aa6f000` · exit 1 | BLOCKED | #<n> | 2026-11-24 | Release Engineer |
| Gate:spec:clean | same branch, edit reverted | green | `PASS (0 errors, 1 warnings)` · exit 0 | BLOCKED (review only) | #<n> | 2026-11-24 | Release Engineer |

The two failing outputs above are real outputs of the vendored scripts on the worked example (`../../agentic-sdlc/examples/worked-example/specs/001-csv-export/`) with the spec edited after approval and a tampered checker in the PR; both jobs still failed because the checkers came from the base branch.

Row rules: observed output is pasted, not paraphrased; the check name is the exact required context; `By` names the role and whether the violation was designed by an independent pass (`subagent`) or `self-review`.

## 4. Verdict and re-proof

- Every required check has a violation row (red + BLOCKED) and a clean row (green) → set `Enforcement: branch-protection` through `project-context` refresh.
- Any violation that goes green, or a merge state other than `BLOCKED` → **gate not enforced**. Fix the workflow or the protection, re-run the case, keep `Enforcement: prompt-only`.
- A case not run (no second account for the code-owner case, plan without environments) → write `CANNOT_VERIFY — <reason>` in the row and list it in the report.

Re-prove the affected gate when: the workflow file changes; branch protection, rulesets or CODEOWNERS change; an `sdlc-dod` command changes; scripts in `.agentic-sdlc/bin/` are upgraded; and every 90 days for all gates. A stale proof (> 90 days) is a `project-context` doctor finding, not a blocker for an individual release.
