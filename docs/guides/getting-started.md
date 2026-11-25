# Getting Started with Claude Superskills

Welcome to Claude Superskills! This guide will help you get up and running in minutes.

## 🚀 Quick Start (3 Commands)

### 1. Install with Zero Config

The simplest way to get started is to run the installer with no arguments:

```bash
npx claude-superskills
```

This will automatically:
- 🔍 Detect your installed platforms (8 supported, from GitHub Copilot CLI to AdaL CLI)
- 📦 Install the 33 available skills (or the ones you choose)
- ✅ Configure for immediate use
- 🎯 Enable all features

**No prompts. No decisions. Just works.**

### 2. List Available Skills

See what's installed:

```bash
npx claude-superskills ls
```

Or the long form:

```bash
npx claude-superskills list
```

### 3. Get Help

```bash
npx claude-superskills help
```

Or check a specific command:

```bash
npx claude-superskills install --help
```

---

## 🔁 Agentic SDLC: First Run

The **Agentic SDLC** takes one change from issue to production with AI agents and named human sign-offs: 7 stages (Discover, Specify, Design, Build, Test, Release, Operate), 4 sign-offs (Product Owner, Tech Lead, human reviewer, Release Owner), 13 agents and 3 paths (Quick, Standard, Full) chosen by a path score.

1. Install the 20 skills:
   ```bash
   npx claude-superskills --bundle agentic-sdlc -y
   ```
2. Follow the [Quickstart](../../skills/agentic-sdlc/references/quickstart.md): one Quick-path bug fix, end to end, in a real repository.
3. Ask your agent, for example: *"Use agentic-sdlc to fix issue #42"*. The router (the Scrum Master) detects the repository state, scores the path and stops at every human sign-off.

The [Agentic SDLC Guide](agentic-sdlc.md) is a reference for later: stages, sign-offs, agents, paths, artifacts, standards mapping and adoption from Spec Kit, Kiro, AI-DLC or BMad. It is not needed before the first run.

---

## 📦 The 33 Skills

| Category | Skills |
|----------|--------|
| **Agentic SDLC (20)** | `agentic-sdlc` (router) · Discover: `issue-triage`, `project-context`, `brainstorming` · Specify: `spec-driven-development`, `grill-me`, `codebase-modernization`, `security-hardening` · Design: `senior-solution-architect`, `writing-plans` · Build: `executing-plans`, `test-driven-development`, `systematic-debugging` · Test: `test-strategy`, `verification-gate`, `multi-axis-code-review` · Release: `deployment-pipeline`, `shipping-and-handover` · Operate: `operations-and-incidents`, `retrospective` |
| **Discovery & orchestration** | `agent-skill-discovery`, `agent-skill-orchestrator` |
| **Development & automation** | `skill-creator`, `prompt-engineer` |
| **Strategy** | `mckinsey-strategist` |
| **Research** | `deep-research`, `us-program-research`, `webpage-reader` |
| **Content** | `youtube-summarizer`, `audio-transcriber`, `pptx-translator`, `document-converter`, `storytelling-expert` |

Versions and purposes: [README → Available Skills](../../README.md#-available-skills) and the [Complete Catalog](../../CATALOG.md).

---

## 🎯 Curated Bundles

Instead of installing everything, you can install just what you need:

### Essential Bundle
Perfect for getting started:
```bash
npx claude-superskills --bundle essential -y
```
Includes: **agentic-sdlc**, **skill-creator**, **prompt-engineer**, **agent-skill-discovery**, **agent-skill-orchestrator**, **brainstorming**, **writing-plans**, **executing-plans**, **grill-me**

### Agentic SDLC Bundle
Router plus 19 stage skills, Discover → Operate:
```bash
npx claude-superskills --bundle agentic-sdlc -y
```
Includes: 20 skills (see the table above)

### Content Bundle
For video, audio, documents and storytelling:
```bash
npx claude-superskills --bundle content -y
```
Includes: **youtube-summarizer**, **audio-transcriber**, **pptx-translator**, **document-converter**, **storytelling-expert**

### Other Bundles
`planning` (7), `research` (5) and `orchestration` (2) — run `npx claude-superskills --list-bundles`.

### All Skills
Complete collection:
```bash
npx claude-superskills --bundle all -y
```
Includes: all 33 skills

**See [Bundles Guide](../bundles/bundles.md) for detailed descriptions.**

---

## 🔍 Search Skills

Can't remember a skill name? Search for it:

```bash
npx claude-superskills --search "prompt"
npx claude-superskills --search "video"
npx claude-superskills --search "transcription"
```

Search works across skill names, descriptions, tags, and categories.

---

## ⚡ Command Shortcuts

Use short commands for faster typing:

| Shortcut | Full Command | Purpose |
|----------|--------------|---------|
| `i` | `install` | Install skills |
| `ls` | `list` | List installed skills |
| `up` | `update` | Update skills |
| `rm` | `uninstall` | Remove skills |
| `doc` | `doctor` | Check installation health |

Examples:
```bash
npx claude-superskills i -a -y    # Install all with flags
npx claude-superskills ls          # Quick list
npx claude-superskills up          # Update skills
```

---

## 🚩 Short Flags

Combine with short flags for maximum efficiency:

| Flag | Full Form | Purpose |
|------|-----------|---------|
| `-a` | `--all` | Operate on all skills |
| `-g` | `--global` | Global installation |
| `-l` | `--local` | Local installation |
| `-y` | `--yes` | Skip confirmations |
| `-q` | `--quiet` | Minimal output |

Examples:
```bash
npx claude-superskills install -a -y -q    # Install everything silently
npx claude-superskills list -q             # List without extra formatting
npx claude-superskills update -g -y        # Global update with confirmation skip
```

---

## 💻 Supported Platforms

CLI AI Skills works on:

- **🤖 GitHub Copilot CLI** - `~/.copilot/skills/`
- **🧠 Claude Code** - `~/.claude/skills/` (or the native plugin)
- **⚙️ OpenAI Codex** - `~/.codex/skills/`
- **OpenCode** - `~/.agent/skills/`
- **Gemini CLI** - `~/.gemini/skills/`
- **Antigravity** - `~/.gemini/antigravity/skills/`
- **Cursor IDE** - `~/.cursor/skills/`
- **AdaL CLI** - `~/.adal/skills/`

All skills are compatible with all platforms. Choose what you use!

---

## 🎓 Next Steps

Now that you're installed, explore:

1. **[Agentic SDLC Guide](agentic-sdlc.md)** - Stages, sign-offs, agents, paths and artifacts
2. **[Skill Anatomy Guide](skill-anatomy.md)** - Understand how skills work internally
3. **[Bundles Guide](../bundles/bundles.md)** - Deep dive into skill collections
4. **[Quality Standards](quality-standards.md)** - Learn best practices for using skills
5. **[Complete Catalog](../../CATALOG.md)** - Browse all skills with metadata

---

## ❓ Troubleshooting

### "Command not found"
```bash
# Ensure you have Node.js installed
node --version

# Install globally instead of npx
npm install -g claude-superskills
npx claude-superskills
```

### "No platforms detected"
```bash
# Check if your platform is installed
npx claude-superskills doctor
```

### "Permission denied"
```bash
# Try with sudo (not recommended)
sudo npx claude-superskills -g

# Or use local install
npx claude-superskills
```

### Need more help?
Check the [main README](../../README.md) or open an issue on GitHub.

---

## 🔗 Quick Links

- 📚 [Full Documentation](../../README.md)
- 📋 [Complete Skill Catalog](../../CATALOG.md)
- 📦 [Bundles Guide](../bundles/bundles.md)
- 💡 [Skill Anatomy](skill-anatomy.md)
- ✅ [Quality Standards](quality-standards.md)
- 🤝 [Contributing](../../CONTRIBUTING.md)
- 📝 [Changelog](../../CHANGELOG.md)

---

**Happy coding! 🚀**
