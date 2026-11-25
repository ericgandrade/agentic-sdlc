# deployment-pipeline

Release-stage skill of the **Agentic SDLC**, used by the Release Engineer. It makes the repository host enforce the method's rules: it maps the `sdlc-dod` Definition of Done and the `spec-lint` / `plan-graph` approval checks to required CI checks (`agentic-sdlc/dod`, `/spec`, `/approvals`, later `/trace`). Branch protection and CODEOWNERS enforce the Test sign-off. A `production` environment with the Release Owner as required reviewer enforces the Release sign-off. Every gate is proven with a deliberately bad change that the host blocks. For each release, the skill picks the deployment mechanism, rehearses the rollback in staging on the release SHA and fires the test alert, then decides **advance, hold or roll back** at each stage from raw readings using the module's thresholds.

## When to use

- When adopting the method (week 3, CI gates) or when the AGENTS.md block says `Enforcement: prompt-only` on a host that offers branch protection.
- To port the gates to GitLab, Azure Pipelines, Jenkins, CircleCI or Bitbucket.
- To re-prove the gates after a workflow, protection, CODEOWNERS or `sdlc-dod` change, or every 90 days.
- Before a release: choose canary, blue-green, rolling, feature flag or expand-contract; rehearse the rollback; record R3, R4 and R5.
- During a rollout: decide advance, hold or roll back for each stage.

Release notes, the R1–R9 checklist, the go/no-go and the Release sign-off request belong to `shipping-and-handover`.

## Modes

| Mode | Use when |
|---|---|
| setup | CI gates, branch protection, CODEOWNERS and the production environment are missing or unproven |
| prove | Re-prove the gates after a change or when the last proof is more than 90 days old |
| rehearse | Before a release's go/no-go: strategy, baseline, rollback rehearsal, test alert |
| rollout | After Release sign-off: stage-by-stage advance / hold / roll back |

## What is included

- `SKILL.md` — modes, Steps 0–9 (discover, map DoD, install, Test sign-off enforcement, Release sign-off enforcement, prove, strategy, rehearsal, rollout, report), anti-rationalization table, critical rules, 5 examples
- `references/ci-discovery.md` — CI detection table for six systems, DoD-to-job mapping with drift classes, coverage floors per stack, the four jobs translated to Azure Pipelines, Jenkins, CircleCI and Bitbucket, CI failure feedback
- `references/branch-protection.md` — read-only inspection with `gh api`, protection and ruleset payloads, `production` environment and deploy job pattern, GitLab and Azure DevOps equivalents, manual fallback without admin rights
- `references/prove-the-gate-bites.md` — case catalog per gate and host control, evidence commands and rows, worked proof with real script output, re-proof triggers
- `references/deployment-strategies.md` — mechanism choice, rollback time targets, flag rules, expand-contract migrations, the stage decision procedure with a worked example, error budget as residual risk
- `prompts/gate-attacker.md` — independent pass that designs bad changes that might still pass
- `prompts/stage-reader.md` — fresh-context advance / hold / roll back decision from raw readings
- `templates/rollback-rehearsal.md` — rehearsal record pasted into release notes §Rollback and §Observability
- `evals/evals.json` — 5 scenarios (setup, two pressure scenarios, hold, roll back, no staging)
- `evals/trigger-eval.json` — 16 trigger queries (9 positive, 7 negative)
- Shared templates in `agentic-sdlc`: `templates/ci/agentic-sdlc.yml` (GitHub Actions), `templates/ci/gitlab-ci.yml` (GitLab CI), `templates/CODEOWNERS`

## Typical invocation

- "Wire the Agentic SDLC gates into CI and turn on branch protection."
- "Prove our merge gates actually block a bad change."
- "Rehearse the rollback for v1.8.0 in staging."
- "Stage 1 has been live 30 minutes. Advance, hold or roll back?"

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| AO-86 | Addy Osmani agent-skills (MIT) | Quality-gate pipeline order; no gate can be skipped | Cheap checks first; the four `agentic-sdlc/*` jobs are required and strict, and no job uses `continue-on-error` or `allow_failure` |
| AO-23 | Addy Osmani agent-skills (MIT) | Prove the gate with violation, clean-control and scanner-error cases | Draft `[gate-proof]` PRs whose merge state is read, never merged; host-control and config cases; `Gate:<name>:<case>` evidence rows; re-prove every 90 days |
| AO-22 | Addy Osmani agent-skills (MIT) | Three-tier check scripts (fast / task / full) | Cost decides where a check runs; CI always runs the full `sdlc-dod` set; ≤ 10 min PR pipeline target, shard above 15 min |
| AO-87 | Addy Osmani agent-skills (MIT) | CI failure feedback loop | Failing lines go to the Developer as data, routed by cause, and counted against the build-test fix bound in `loops.md` |
| AO-89 | Addy Osmani agent-skills (MIT) | Staged rollout with advance / hold / rollback thresholds | The module's stage table and thresholds replace the source's; a hold rule is added (window, < 100 events, gaps, unreachable signal, 2× cap) |
| AO-90 | Addy Osmani agent-skills (MIT) | Rollback plan template and time-to-rollback targets | `templates/rollback-rehearsal.md` on the release SHA in staging; a rollback slower than its target is an Important residual risk |
| AO-88 | Addy Osmani agent-skills (MIT) | Feature-flag lifecycle | Default off (R4), owner and removal ≤ 2 weeks after 100%, both states tested in CI, release flags vs kill switches |
| AO-77 / AO-92 | Addy Osmani agent-skills (MIT) | Tag as source of truth; error-budget release gate | Deploys only `v*` tags through the approved environment; the error budget is shown to the Release Owner as a residual risk and never loosens stage thresholds |
| SP-67 | Superpowers (MIT) | Finishing a branch: test the merged result, no history rewriting | Strict required checks re-test against the latest base; force push and branch deletion off |
| SP-64 | Superpowers (MIT) | Verification gate: fresh evidence before a claim | Every proof, rehearsal and stage reading is pasted output with exit code and time |
| BM-65 | BMad Method (MIT) | Launch plan with go/no-go and readiness owner | Rollout starts only after the Release sign-off row and a matching host environment approval for the same tag |
| BM-09 | BMad Method (MIT) | Version-control sanity gate | Clean tree and R1 SHA before the rehearsal; deploy from the tag, never from a working copy |
| MP-80 | Matt Pocock skills (MIT) | Destructive-git guardrail | Enforced by the host (no force push or deletion, admins included) instead of a local hook |
| MP-66 | Matt Pocock skills (MIT) | Redaction discipline | Tokens, account IDs and secrets are redacted in all evidence |
| `core/aidlc-common/stages/operation/deployment-pipeline.md` | AWS AI-DLC (MIT-0) | Design the pipeline only from discovered evidence | Step 0 inventory; never invent a missing CI file, environment or deploy command |
| `core/knowledge/aidlc-pipeline-deploy-agent/deployment-strategies.md`, `core/aidlc-common/stages/operation/deployment-execution.md` | AWS AI-DLC (MIT-0) | Strategy catalog, expand-contract, flag categories; check credentials before asking | Mechanism-choice table and rollback targets; staging credentials checked read-only with account IDs masked |

AWS AI-DLC has no inventory file, so its source paths serve as IDs. No Agile V material applied.

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-24 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | devops |
| Tags | agentic-sdlc, ci-cd, branch-protection, quality-gates, deployment, rollback, canary, feature-flags |
| Risk | medium |
