# Host guard: GitHub Copilot CLI

Copilot CLI has no project permission file. Its concrete controls are command-line flags and the `tools:`
list of a custom agent (`references/platforms.md` §2). `project-context` Step 7c records them here and in
the adoption ledger; `doctor` reports `enforced` when `.github/agents/*.agent.md` exists.

## Flags for every session

Start sessions through one alias or script so the flags are never forgotten:

```sh
copilot \
  --deny-tool 'shell(git push)' \
  --deny-tool 'shell(git merge)' \
  --deny-tool 'shell(git tag)' \
  --deny-tool 'shell(gh pr merge)' \
  --deny-tool 'shell(npm publish)'
```

A deny rule wins over any `--allow-tool` rule. Never add `--allow-all-tools` on an adopted repository.

## Reviewer agent (`.github/agents/reviewer.agent.md`)

The Reviewer reads and runs checks; it never edits files or pushes:

```markdown
---
name: reviewer
description: Agentic SDLC Reviewer. Reads the diff and runs the checks; never edits or pushes.
tools: ['view', 'bash']
---
Follow the agentic-sdlc Reviewer brief (agents/reviewer.md). Never run git push, merge or tag.
```

The front matter alone, as a line check: `tools:` lists only `view` and `bash`, with no `edit` or `create`.

## What stays prompt-only

Copilot CLI runs no pre-tool hook from this template, so the guard gates (code writes before the Design
sign-off, protected paths, sign-offs without a human turn) are enforced by instruction and by CI
(`approval-check`, S20 review), not by the host.
