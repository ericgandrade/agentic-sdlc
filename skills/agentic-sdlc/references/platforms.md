# Agentic SDLC — Platforms: Install, Mapping and Degradation

Load this file during `project-context` setup on a new platform, when the router finds that the host lacks subagents, shell access, permissions or CI, when `doctor` reports `enforcement: prompt-only`, and when choosing a model per role (§5). It maps the method's abstract actions (dispatch an agent, read, edit, run a command, restrict a tool) onto the eight supported platforms and states exactly what the method does when a capability is missing. The method itself is plain Markdown: Node ≥ 18 is needed only for the script gates, and every gate has a Markdown-only equivalent (§4).

## 1. Capability probe (mechanism 15.1)

**Trigger.** `project-context` setup or adopt mode, and router Step 0 when the AGENTS.md block has no `Platform:` line.

**Procedure.** Check five capabilities in this order; each check takes one tool call or one command.

| # | Capability | Check | Present when |
|---|---|---|---|
| 1 | Subagents | The session's tool list contains the dispatch tool named in §2 | Tool listed |
| 2 | Shell | Run `git --version` | Exit 0 |
| 3 | Node ≥ 18 | Run `node --version` | Major version ≥ 18 |
| 4 | Host enforcement | `gh api repos/{owner}/{repo}/branches/{default}/protection` (GitHub) or the GitLab / Azure DevOps equivalent in `references/governance.md` §Enforcement | HTTP 200 with ≥ 1 required review |
| 5 | CI | A workflow file exists (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `azure-pipelines.yml`) | File found |

**Output.** One line in the AGENTS.md block, rewritten on every probe:

```
- Platform: claude-code · subagents: yes · shell: yes · node: 20.11 · ci: github-actions
- Enforcement: branch-protection · permissions: enforced
```

**Failure behaviour.** A check that errors (no network, no `gh` login) is recorded as `unknown`; `unknown` is treated as absent for every rule in §3.

## 2. Per-platform mapping

### Install and instructions

| Platform | Install target (`npx agentic-sdlc-method`) | Instruction file the host reads | Block location |
|---|---|---|---|
| GitHub Copilot CLI | `~/.copilot/skills/` | `AGENTS.md`, `.github/copilot-instructions.md` | `AGENTS.md` |
| Claude Code | `~/.claude/skills/` or `/plugin install agentic-sdlc@agentic-sdlc` | `CLAUDE.md` | `AGENTS.md` + `@AGENTS.md` import line in `CLAUDE.md` |
| OpenAI Codex (CLI + App) | `~/.codex/skills/` | `AGENTS.md` | `AGENTS.md` |
| OpenCode | `~/.agent/skills/` | `AGENTS.md` | `AGENTS.md` |
| Gemini CLI | `~/.gemini/skills/` | `GEMINI.md` (or the file set in `context.fileName`) | `AGENTS.md` + `context.fileName: ["AGENTS.md", "GEMINI.md"]` in `.gemini/settings.json` |
| Antigravity | `~/.gemini/antigravity/skills/` | `GEMINI.md`, workspace rules | `AGENTS.md` + a one-line pointer rule |
| Cursor IDE | `~/.cursor/skills/` | `AGENTS.md`, `.cursor/rules/*.mdc` | `AGENTS.md` |
| AdaL CLI | `~/.adal/skills/` | `AGENTS.md` | `AGENTS.md` |

The block lives in exactly one file. Every other instruction file the host reads holds one pointer line (`Read AGENTS.md first; the AGENTIC-SDLC block is authoritative.`), so two copies never drift.

### Agents, tools and permissions

| Platform | Dispatch an agent (fresh context) | Read · edit · shell tools | Restricting a role's tools (Reviewer read-only, no `git push`) |
|---|---|---|---|
| GitHub Copilot CLI | `task` tool; custom agents in `.github/agents/<name>.agent.md` with a `tools:` list | `view` · `edit`, `create` · `bash` | Agent `tools:` list; `--deny-tool 'shell(git push)'` |
| Claude Code | `Agent` (Task) tool; `.claude/agents/<name>.md` with `tools:` | `Read` · `Edit`, `Write` · `Bash` | `.claude/settings.json` `permissions.deny: ["Bash(git push:*)"]`; `PreToolUse` hooks |
| OpenAI Codex | `spawn_agent` with `multi_agent = true` in `~/.codex/config.toml`; without it, one `codex exec` process per agent | `shell` · `apply_patch` · `shell` | `sandbox_mode = "read-only"` for Reviewer runs; `approval_policy = "on-request"` |
| OpenCode | `task` tool; `.opencode/agent/<name>.md` with `mode: subagent` | `read` · `edit`, `write` · `bash` | `opencode.json` `permission` per agent: `edit: deny`, `bash: {"git push*": "deny"}` |
| Gemini CLI | `invoke_agent` when subagents are enabled; without it, one `gemini -p` process per agent | `read_file` · `replace`, `write_file` · `run_shell_command` | `tools.exclude` in `.gemini/settings.json`; `--approval-mode default` |
| Antigravity | `invoke_subagent`; Agent Manager for parallel agents | `view_file` · `replace_file_content`, `write_to_file` · `run_command` | Terminal execution policy with a deny list containing `git push`; review policy "request review" |
| Cursor IDE | A new Agent chat per role (fresh context); Background Agents for unattended runs | `read_file` · `edit_file` · `run_terminal_cmd` | Auto-run allow list without `git push`; deny list |
| AdaL CLI | No dispatch tool assumed; fallback §3 row 1 | read · edit · shell (map by function) | Per-action approval prompt; recorded `permissions: prompt-only` |

The capability probe decides at runtime; this table is the expected default. A platform release that adds or renames a tool changes only this table.

**Host guard templates.** `templates/host-config/<host>/` holds a minimal config for each of the five hosts with concrete controls: `claude-code/settings.json` (to `.claude/settings.json`), `copilot-cli/README.md` (the `--deny-tool` flags and a `.github/agents/` `tools:` example), `codex/config.toml` (to `.codex/config.toml`), `opencode/opencode.json` (to `opencode.json`) and `gemini/settings.json` (to `.gemini/settings.json`). `project-context` Step 7c writes the one for the detected host in the context PR. Only the Claude Code template wires `scripts/guard.mjs` hooks: a `PreToolUse` hook (`guard.mjs pre-tool --host claude-code`, `onFailure: block`) that refuses push, merge on the default branch, tag, publish, deploy and `--force` (G01), code writes before a valid Design sign-off on Standard and Full (G02), writes to S20 paths and the AGENTIC-SDLC block (G03), and a new approved sign-off row without an explicit human turn in the last 15 minutes (G04); and a `UserPromptSubmit` hook (`guard.mjs human-turn`) that records each human turn as a prompt hash in `.agentic-sdlc/runs/human-turns.jsonl`. On the other four hosts the templates restrict tools; the guard gates stay prompt-enforced and CI (`approval-check`, S20) backs them. Antigravity, Cursor and AdaL have no concrete controls: the block records `permissions: prompt-only` and `doctor` names them on every run.

## 3. Degradation rules

| # | Missing capability | Fallback procedure | Record | Failure behaviour |
|---|---|---|---|---|
| 1 | Subagents | Run each agent as a separate labelled pass in the same session, loading only that agent's file and listed inputs. The Test Engineer writes `acceptance-tests.md` from the spec **before** Build starts and commits it on `at/NNN-slug` (`verification.md` §2), so the tests are fixed before any diff exists | Every check of the author's own work is labelled `self-review` in the PR Verification and Review triage sections | Missing `self-review` label on a same-session check → Reviewer Important finding; PR verdict NO-GO |
| 2 | Shell | The agent writes the exact commands; the human runs them and pastes the output | Verification rows marked `run-by: human` | No pasted output → status `CANNOT_VERIFY`; no completion claim |
| 3 | Node ≥ 18 | Markdown-only path (§4) | Block `node: absent`; PR banner `Enforcement: prompt-only` | Doctor† reports WARN once Node is present; the vendored scripts stay unused until then |
| 4 | git | None: commit trailers, fingerprints and approval binding need git | — | Router status `BLOCKED`, next step `git init` and a first commit |
| 5 | Host enforcement | Approvals stay prompt-enforced; the agent never merges, pushes to the default branch or deploys | Block `Enforcement: prompt-only`; PR body banner | Doctor† WARN on every run until branch protection is set up |
| 6 | CI | Run every gate locally before opening the PR and paste the output | PR body `ci: none` | Missing local output → PR verdict NO-GO |
| 7 | Tool restriction | Role limits from `agents/*.md` apply by instruction only. Hosts with controls get the §2 host guard template first; Antigravity, Cursor and AdaL always land here | Block `Enforcement:` line `permissions: prompt-only`; `doctor` check 6 lists the host as `prompt-only` | A role using a tool outside its list → stop that pass, discard its output, re-run the role |

## 4. Markdown-only path (no Node)

Every script gate has a manual equivalent with the same pass rule. The method's rules, approvals and records do not change.

| Script | Manual equivalent |
|---|---|
| `status.mjs`† | Apply the router Step 0 table by reading the files |
| `path-score.mjs`† | Fill the §2 rubric of `references/paths.md` by hand |
| `spec-lint.mjs` | Check the required sections of `templates/spec.md` one by one; AC IDs contiguous from `AC-1` |
| Approval hash | Bind the approval to the commit instead: `rev N @ <git log -1 --format=%h -- specs/NNN-slug/spec.md>`; any later commit touching the file voids it |
| `plan-graph.mjs` | Each `Blocked by` names only lower task IDs (acyclic by construction); list waves by hand in `plan.md` |
| `dod-gate.mjs` | Run every `sdlc-dod` command; paste each exit code; any non-zero → fail |
| Evidence fingerprint | `git status --porcelain` empty and `git rev-parse --short=12 HEAD`; a dirty tree gives no valid evidence |
| `evidence.mjs record` / `check` | Commit first; the tree must be clean (`git status --porcelain` prints nothing). Run each DoD and AC command; copy its exit code and the last ≤ 40 output lines into the PR `## Verification` table with `head:<first 12 hex of git rev-parse HEAD>` as the fingerprint and the ISO-8601 time. With Node but an older vendored copy, compute the fingerprint (`node <skill-dir>/scripts/lib/git.mjs fingerprint`) before and after the run; different → the tree changed, discard the rows and repeat. `check`: every AC needs a passing row on the current fingerprint (`references/verification.md` §4 Staleness rule) |
| `trace-check.mjs` | Fill the PR Trace matrix (`references/verification.md` §5): (1) ACs from `spec.md` (Quick: the issue); (2) tasks from the `plan.md` `## Tasks` AC column; (3) commits from `git log --no-merges --format='%h%x09%s%x09%(trailers:key=Refs,valueonly,separator=%x20)' <base>..HEAD` (the subject form `[T3, AC-2]` counts too); mark artifact commits (§5 exemption: for example the issue, spec, approval register, threat model, acceptance tests with `Refs: AC-n`, `chore: archive run ledger r1`, the review record; never `.agentic-sdlc/bin/` or `config.json`, which change the gates); a commit that also touches other files is a code commit; (4) tests from the `acceptance-tests.md` Map, each name starting with its AC ID, and each AC filter written `^AC-n(?![0-9])`; a run that selects 0 tests fails; (5) the PR Trace row, the release-notes AC list and, once released, an `ops.md` reading ≤ 14 days old; list every orphan with its kind |
| `budget-check.mjs` | `sed '/^---$/,/^---$/d' <file> \| wc -w` against the budgets: router 2,200 · quickstart 1,200 · README install section 300 · reference 3,000 · agent file 600 |

† Added in a later release; manual fallback in `references/artifacts.md` §Later-release files.

## 5. Model per role

Guidance only: the method names no vendor and runs on any model the host offers. When the host lets a dispatch choose its model, pick the tier by the cost of a wrong answer, not by the size of the task.

| Role | Tier | Why |
|---|---|---|
| Architect, Reviewer, Security Auditor | Largest available | Judgement errors here escape every later gate |
| Analyst, Product Manager, UX Designer, Planner, Test Engineer | Largest available, or the default | Spec, plan and acceptance tests set the baseline every later stage checks against |
| Developer | Default; fast for a task sized S with a fixed interface | The DoD, the AC tests and the independent review catch its errors |
| Tech Writer, Release Engineer, SRE (routine readings), Scrum Master (progress lines) | Fast | Template-driven output with checks after it |

Prefer a review lens on a tier no smaller than the one that wrote the code. The tier never changes a bound, an approval or the evidence rule.

## Sources

The capability-mapping table follows the per-harness tool-mapping approach of Superpowers (MIT). The fallback for hosts without subagents adapts the separate-pass review discipline of Addy Osmani's agent-skills (MIT). All text is original.
