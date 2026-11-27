# Agentic SDLC — Module Index, Off the Default Path

The router Module Index (`SKILL.md`) lists the modules a Standard work item loads. This file lists the rest: scripts, CI templates, examples and the modules for upgrade, adoption, brownfield code and extensions. Load it when one of the triggers below applies; each stage skill also names the script it runs at its own step. The router's rule for a missing module applies here too: follow the router rule summary, record `module missing: <path>` in the PR body and continue.

| File | Load when |
|---|---|
| `references/upgrading.md` | Skill version changed; doctor WARN after an upgrade |
| `references/adoption.md` | Team rollout; existing Spec Kit, Kiro or OpenSpec folders |
| `references/brownfield.md` | Touching code without tests |
| `references/extension-interface.md` | Writing an extension; `ext-check` exit ≠ 0 (load none) |
| skill `security-hardening` | Regulated work; SSDF mapping |
| `templates/ci/agentic-sdlc.yml`, `ci/gitlab-ci.yml`, `ci/security.yml`, `CODEOWNERS`, `host-config/` | `project-context` CI and enforcement setup |
| `scripts/spec-lint.mjs`, `plan-graph.mjs`, `approval-check.mjs`, `audit-export.mjs` | Before Specify / Design sign-off; CI; audit |
| `scripts/preflight.mjs`, `run-ledger.mjs` | Build start; unattended runs; each loop round |
| `scripts/dod-gate.mjs`, `evidence.mjs`, `trace-check.mjs` | Completion claims; before Reviewer GO and Test sign-off; CI |
| `scripts/status.mjs`, `doctor.mjs`, `guard.mjs` | Router Step 0; setup check; host hooks |
| `scripts/budget-check.mjs`, `ext-check.mjs` | CI on `skills/**`; before loading any extension |
| `scripts/lib/md.mjs`, `lib/git.mjs`, `lib/cli.mjs` | Imported by the scripts above |
| `examples/worked-example/` | Learning the Standard path; script test fixtures |
| `examples/extensions/` | Writing an extension |

Scripts are dependency-free Node ≥ 18 ES modules. Exit codes: `0` pass · `1` check failed · `2` input missing or unparsable · `3` bound reached, escalate. `--json` prints a machine-readable result. Node absent → the method runs from the Markdown rules and `doctor` reports `enforcement: prompt-only`.
