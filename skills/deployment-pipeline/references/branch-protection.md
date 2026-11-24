# Branch protection and environment approvals

Load in Step 0 (inspect), Step 3 (Test sign-off) and Step 4 (Release sign-off). Contract: `../../agentic-sdlc/references/governance.md` §7. Every write command below changes repository settings outside the diff: show it with the before/after JSON, get the admin's explicit "yes", end the turn, run it in a later turn. Never lower a stricter existing value.

## 1. Inspect (read-only)

```bash
gh repo view --json nameWithOwner,defaultBranchRef,viewerPermission
BR=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)

# Classic protection (admin read). 404 "Branch not protected" = none; 403/404 without admin = rights missing.
gh api "repos/{owner}/{repo}/branches/$BR/protection"
# Effective rules, including organization rulesets (readable with read access)
gh api "repos/{owner}/{repo}/rules/branches/$BR"
gh api "repos/{owner}/{repo}/rulesets" --jq '.[] | {id, name, enforcement}'
# Environments and their protection rules
gh api "repos/{owner}/{repo}/environments" --jq '.environments[] | {name, protection_rules}'
# CODEOWNERS syntax errors and unknown owners (empty list = valid)
gh api "repos/{owner}/{repo}/codeowners/errors" --jq '.errors'
# Exact check names produced by CI on a recent commit
gh api "repos/{owner}/{repo}/commits/$(git rev-parse HEAD)/check-runs" --jq '.check_runs[].name'
```

`gh api` fills `{owner}` and `{repo}` from the current checkout; it fills `{branch}` with the *current* branch, so pass the default branch explicitly. Record the HTTP status of every call in the discovery report.

Gaps to look for: required check names that no job produces (a typo blocks every PR forever, or a missing name blocks nothing); `strict: false`; `enforce_admins: false`; bypass actors on rulesets; CODEOWNERS errors; a `production` environment with no reviewers or with the deployer as the only reviewer.

## 2. GitHub: Test sign-off on the default branch

Classic branch protection:

```bash
gh api -X PUT "repos/{owner}/{repo}/branches/$BR/protection" --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["agentic-sdlc/dod", "agentic-sdlc/spec", "agentic-sdlc/approvals"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

`PUT` replaces the whole protection object: merge the existing contexts and any higher review count into the payload first. Add `agentic-sdlc/trace` to `contexts` only once `trace-check.mjs`† is vendored and proven (until then the job warns and passes, so requiring it proves nothing).

Repository or organization rulesets (preferred where the organization already uses them):

```bash
gh api -X POST "repos/{owner}/{repo}/rulesets" --input - <<'JSON'
{
  "name": "agentic-sdlc",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": true,
        "required_review_thread_resolution": false } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "agentic-sdlc/dod" },
          { "context": "agentic-sdlc/spec" },
          { "context": "agentic-sdlc/approvals" } ] } }
  ]
}
JSON
```

An empty `bypass_actors` is the equivalent of `enforce_admins: true`. A bypass actor that must stay (break-glass team) → list it in the discovery report and in the emergency waiver procedure (governance §6: ≤ 7 days, retroactive approval ≤ 2 business days).

CODEOWNERS: copy `../../agentic-sdlc/templates/CODEOWNERS`, replace the team handles, then re-run the `codeowners/errors` call. Teams need write access or GitHub ignores the line silently.

Two reviewers for Full-path PRs (governance §5): host rules cannot vary by path size. Options in order: (a) `required_approving_review_count: 2` when most work is Full; (b) keep 1 and have the Reviewer confirm the second human approval in the Test sign-off until `approval-check --pr`† runs in the `approvals` job.

## 3. GitHub: Release sign-off on the `production` environment

```bash
TEAM_ID=$(gh api "orgs/<org>/teams/<release-owners-slug>" --jq .id)   # or: gh api users/<login> --jq .id
gh api -X PUT "repos/{owner}/{repo}/environments/production" --input - <<JSON
{
  "wait_timer": 0,
  "prevent_self_review": true,
  "reviewers": [ { "type": "Team", "id": $TEAM_ID } ],
  "deployment_branch_policy": { "protected_branches": false, "custom_branch_policies": true }
}
JSON
gh api -X POST "repos/{owner}/{repo}/environments/production/deployment-branch-policies" -f name="$BR" -f type=branch
gh api -X POST "repos/{owner}/{repo}/environments/production/deployment-branch-policies" -f name='v*' -f type=tag
```

`prevent_self_review: true` stops the person who triggered the run from approving it, matching "owner ≠ requester". Required reviewers on private repositories need a paid GitHub plan; without it → §5.

Deploy job pattern (ADAPT the deploy script; the version is passed through `env`, never interpolated into `run:`):

```yaml
name: deploy
on:
  workflow_dispatch:
    inputs:
      tag:   { description: "Release tag (vX.Y.Z)", required: true, type: string }
      stage: { description: "Rollout stage", required: true, type: choice, options: [stage-1, stage-2, stage-3] }
permissions:
  contents: read
concurrency:
  group: production
  cancel-in-progress: false
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production          # waits for the Release Owner's approval
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.tag }}
      - name: Check tag format
        env: { TAG: "${{ inputs.tag }}" }
        run: |
          case "$TAG" in v[0-9]*.[0-9]*.[0-9]*) ;; *) echo "::error::not a release tag: $TAG"; exit 1 ;; esac
      - name: Deploy
        env: { TAG: "${{ inputs.tag }}", STAGE: "${{ inputs.stage }}" }
        run: ./scripts/deploy.sh "$TAG" "$STAGE"   # ADAPT: the command named in the approved release notes
```

Each stage is a separate run, so each advance waits for an approval: the Release Owner approves stage 2 after reading the stage 1 row in §Deploy log.

Rollback must not queue behind an approval. Choose one and write it in the runbook: (a) the rollback is a flag-off in the flag service, done by the on-call engineer; (b) a `production-rollback` environment restricted to the default branch that runs only the rollback script with no inputs other than the previous tag; (c) the Release Owner stays reachable for the whole watch window and approves the rollback run at once. Rehearse the chosen path (Step 7).

## 4. GitLab and Azure DevOps

**GitLab** (`glab api` fills `:id` from the current checkout; approval rules, code owner approval and deployment approvals need Premium or Ultimate):

```bash
glab api -X PUT projects/:id -f only_allow_merge_if_pipeline_succeeds=true
glab api -X POST projects/:id/protected_branches -f name=main -f push_access_level=0 -f merge_access_level=30 \
  -f allow_force_push=false -f code_owner_approval_required=true
glab api -X POST projects/:id/approvals -f reset_approvals_on_push=true \
  -f merge_requests_author_approval=false -f merge_requests_disable_committers_approval=true
glab api -X POST projects/:id/approval_rules -f name=test-sign-off -f approvals_required=1
glab api -X POST projects/:id/protected_environments -f name=production \
  -f 'deploy_access_levels[][access_level]=40' -f 'approval_rules[][group_id]=<release-owners-group-id>' \
  -f 'approval_rules[][required_approvals]=1'
```

Existing protection on `main` → `PATCH projects/:id/protected_branches/main` instead of `POST`. Field names change between GitLab versions; read the instance's API docs before running. "Pipelines must succeed" blocks the merge on any failed job, so no job of `gitlab-ci.yml` may carry `allow_failure: true`. Free tier: no approval rules → §5 for the reviews, but "Pipelines must succeed" still enforces the checks.

**Azure DevOps** (branch policies on `main`):

```bash
az repos policy approver-count create --repository-id <repo-id> --branch main --blocking true --enabled true \
  --minimum-approver-count 1 --creator-vote-counts false --allow-downvotes false --reset-on-source-push true
az repos policy required-reviewer create --repository-id <repo-id> --branch main --blocking true --enabled true \
  --required-reviewer-ids "<tech-leads-group>" --path-filter "/specs/*" --message "Spec change needs a Tech Lead"
az repos policy build create --repository-id <repo-id> --branch main --blocking true --enabled true \
  --build-definition-id <pipeline-id> --display-name agentic-sdlc/spec \
  --queue-on-source-update-only false --manual-queue-only false --valid-duration 0
```

Azure Repos has no CODEOWNERS; the required-reviewer policy with `--path-filter` plays that role. Release sign-off: Pipelines → Environments → `production` → Approvals and checks → Approvals (Release Owners, "Allow approvers to approve their own runs" off) plus a "Branch control" check limited to `refs/heads/main` and `refs/tags/v*`.

## 5. Manual fallback (no admin rights, no plan feature)

1. Open an issue titled `Agentic SDLC enforcement: repository settings request` assigned to an admin. Body: the inspection output (§1), the exact payloads (§2–§4), and the proof plan (`prove-the-gate-bites.md`).
2. Keep `Enforcement: prompt-only` in the AGENTS.md block; the CI jobs still run and report, they just do not block.
3. Every PR description starts with `enforcement: prompt-only — approvals are not system-enforced on this repository`; the Reviewer refuses GO while any `agentic-sdlc/*` check is red, even though the host would allow the merge.
4. Without environment approvals: the deploy command runs only from a session where the Release Owner has written the `## Approval` row in the release notes for this tag; the Release Engineer pastes the row into §Deploy log before each stage.
5. Report `DONE_WITH_CONCERNS` with the issue link. When the admin applies the settings, run Step 5 (prove) before changing the Enforcement line.
