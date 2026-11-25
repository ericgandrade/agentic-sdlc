# Claude Superskills: installation and skills library

Installer, platforms, bundles and the full skill catalog. The project overview is in the [root README](../README.md).

> `npx claude-superskills` and the install script ship the released version from `main`, which does not include the Agentic SDLC yet.

## 🚀 Quick Install

**One-liner (recommended):**
```bash
curl -fsSL https://raw.githubusercontent.com/ericgandrade/claude-superskills/main/scripts/install.sh | bash
```

**Or use NPX (zero-install):**
```bash
npx claude-superskills
```

The installer always uses **global installation** (`~/.<platform>/skills`), compares installed skill versions with the current installer version, shows differences, and recommends updates/new installs automatically.

**Other methods:**
```bash
# npm global
npm install -g claude-superskills

# With bundles
npx claude-superskills --bundle essential -y
npx claude-superskills --bundle agentic-sdlc -y
```

**Local install (no npm/npx required):**

If you have cloned the repository and want to install skills directly, without any internet download or Node.js:
```bash
git clone https://github.com/ericgandrade/claude-superskills
cd claude-superskills

# Interactive — choose which platforms to install to
./scripts/local-install.sh

# Auto-install to all detected platforms
./scripts/local-install.sh -y

# Silent auto-install (CI / scripted environments)
./scripts/local-install.sh -y -q
```

The script reads directly from `skills/`, detects your installed platforms, and copies everything into the right directories. No Node.js, no npm, no internet.

See [Installation Guide](INSTALLATION.md) for all methods and troubleshooting.

**Uninstall:**
```bash
curl -fsSL https://raw.githubusercontent.com/ericgandrade/claude-superskills/main/scripts/uninstall.sh | bash
```

## 🔁 Agentic SDLC

The **Agentic SDLC** follows the standard software development life cycle with AI agents: **7 stages, 4 human sign-offs, 13 agents named by function and 3 paths (Quick, Standard, Full) chosen by a path score.** Agents execute; named humans approve. One rule ties the cycle together: every requirement is proven, from the spec to production.

```mermaid
flowchart LR
  D[Discover] --> S[Specify] -->|Specify sign-off: Product Owner| G[Design] -->|Design sign-off: Tech Lead| B[Build] --> T[Test] -->|Test sign-off: human reviewer| R[Release] -->|Release sign-off: Release Owner| O[Operate]
  O -->|incidents, indicator misses, retro actions| D
```

| Stage | Lead agent | Skills | Human sign-off |
|-------|------------|--------|----------------|
| **Discover** | Analyst | `issue-triage`, `project-context`, `brainstorming` | — |
| **Specify** | Analyst | `spec-driven-development`, `grill-me` (+ `codebase-modernization` for brownfield, `security-hardening` for the threat model) | Product Owner |
| **Design** | Planner | `senior-solution-architect`, `writing-plans` | Tech Lead |
| **Build** | Developer | `executing-plans`, `test-driven-development`, `systematic-debugging` | — |
| **Test** | Reviewer | `test-strategy`, `verification-gate`, `multi-axis-code-review`, `security-hardening` | human reviewer |
| **Release** | Release Engineer | `deployment-pipeline`, `shipping-and-handover` | Release Owner |
| **Operate** | SRE | `operations-and-incidents`, `retrospective` | — |

The router skill `agentic-sdlc` plays the **Scrum Master**: it reads the repository state, picks the path and hands each stage to the right agent and skill. The 13 agents are Scrum Master, Analyst, Product Manager, UX Designer, Planner, Architect, Developer, Test Engineer, Reviewer, Security Auditor, Tech Writer, Release Engineer and SRE. Every agent report ends with one status (`DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, `NEEDS_CONTEXT`, `CANNOT_VERIFY`), and every fix loop is bounded.

```bash
# Install the 20 Agentic SDLC skills
npx claude-superskills --bundle agentic-sdlc -y
```

Then ask your agent: *"Use agentic-sdlc to fix issue #42"*. First run: [Quickstart](../skills/agentic-sdlc/references/quickstart.md) (one Quick-path bug fix end to end). Reference: [Agentic SDLC Guide](guides/agentic-sdlc.md) (stages, sign-offs, agents, paths, artifacts, standards mapping, coming from Spec Kit / Kiro / AI-DLC / BMad). Worked example: [`skills/agentic-sdlc/examples/worked-example/`](../skills/agentic-sdlc/examples/worked-example/).

## 🔌 Claude Code Plugin (Native)

Use claude-superskills as a native Claude Code plugin — no npm, no Node.js required.
Requires **Claude Code v1.0.33+** (`claude --version` to check).

---

### Option A — Claude Code CLI (Terminal)

> ⚠️ **Important:** While the universal installer (`npx claude-superskills`) works perfectly to copy skills into `~/.claude/skills/`, using the native Claude Code Plugin system (described below) is the **recommended and most suitable installation method** for Claude Code users.

**Method 1: Interactive UI (Inside a running `claude` session) — Recommended**

Start a Claude Code session:
```bash
claude
```

Then run these slash commands inside the session:
```text
# 1. Add the marketplace
/plugin marketplace add ericgandrade/claude-superskills

# 2. Install the plugin
/plugin install claude-superskills@claude-superskills
```

Alternatively, open the plugin manager with `/plugin` → navigate to the **Discover** tab → search for "claude-superskills" → press **Enter** → choose your preferred scope.

**Method 2: Shell command (Outside a session)**

> 🐛 **Known Bug:** The `claude plugin install` shell command is currently **failing** due to an upstream issue in Claude Code. We strongly recommend using the interactive in-session method above. If you prefer a CLI approach, the universal installer (`npx claude-superskills`) is completely reliable and stable. Tracked at: [anthropics/claude-code#29722](https://github.com/anthropics/claude-code/issues/29722).

```bash
# Attempt to add marketplace + install in one flow (Currently unstable)
claude plugin install claude-superskills@claude-superskills
```

Choose your scope with `--scope`:

```bash
claude plugin install claude-superskills@claude-superskills --scope user     # all your projects (default)
claude plugin install claude-superskills@claude-superskills --scope project  # team-shared via .claude/settings.json
claude plugin install claude-superskills@claude-superskills --scope local    # this project only, gitignored
```

**Method 3: Local test (no install needed)**

```bash
git clone https://github.com/ericgandrade/claude-superskills
claude --plugin-dir ./claude-superskills
```

---

### Option B — Claude.ai Web (claude.ai)

Plugin installation on claude.ai requires the plugin to be listed in the **official Anthropic marketplace**. Submission is pending. Once approved, you will be able to install directly from:

> **Settings → Extensions → Browse Plugins** on [claude.ai](https://claude.ai)

To be notified when the plugin is available on claude.ai, watch this repository.

---

### Option C — Claude Desktop Cowork (Custom Plugin Upload)

If you use Claude Desktop with Cowork, the safest path is to generate a plugin zip locally and upload it manually in Cowork. This path does not depend on the `claude plugin install` shell flow.

Generate the package with the installer:

```bash
npx claude-superskills package-cowork
```

Or let the interactive installer detect Cowork and offer it as a packaging target:

```bash
npx claude-superskills
```

The installer will generate a zip like:

```text
~/.claude-superskills/plugin-output/claude-superskills-v2.0.3.zip
```

Then update Cowork manually:

1. Open Claude Desktop.
2. Switch to `Cowork`.
3. Open `Customize`.
4. Find the existing `claude-superskills` plugin.
5. Remove the previous version first.
6. Upload the new zip generated by the installer.
7. Confirm the new version appears in Cowork.

Important:
- The historical `claude plugin install` bug affects the GitHub/CLI install flow, not the Cowork custom zip upload flow.
- Cowork is treated as `package + manual upload`, not as an auto-installed `~/.claude/skills/` target.
- Current support level: validated on macOS; Windows and Linux detection are implemented as best-effort heuristics and should be treated as not yet fully validated in real Cowork environments.

---

### Once installed — all 33 skills under the `claude-superskills:` namespace

```
/claude-superskills:agentic-sdlc
/claude-superskills:issue-triage
/claude-superskills:project-context
/claude-superskills:brainstorming
/claude-superskills:spec-driven-development
/claude-superskills:grill-me
/claude-superskills:codebase-modernization
/claude-superskills:security-hardening
/claude-superskills:senior-solution-architect
/claude-superskills:writing-plans
/claude-superskills:executing-plans
/claude-superskills:test-driven-development
/claude-superskills:systematic-debugging
/claude-superskills:test-strategy
/claude-superskills:verification-gate
/claude-superskills:multi-axis-code-review
/claude-superskills:deployment-pipeline
/claude-superskills:shipping-and-handover
/claude-superskills:operations-and-incidents
/claude-superskills:retrospective
/claude-superskills:skill-creator
/claude-superskills:prompt-engineer
/claude-superskills:agent-skill-discovery
/claude-superskills:agent-skill-orchestrator
/claude-superskills:mckinsey-strategist
/claude-superskills:deep-research
/claude-superskills:us-program-research
/claude-superskills:webpage-reader
/claude-superskills:youtube-summarizer
/claude-superskills:audio-transcriber
/claude-superskills:pptx-translator
/claude-superskills:document-converter
/claude-superskills:storytelling-expert
```

> **npm install still works** for GitHub Copilot, Cursor IDE, Gemini CLI, and 5 other platforms. The plugin format is Claude Code-specific.

## ✨ Features

- **33 Universal Skills** - Work on all platforms
- **Agentic SDLC** - 20-skill method from Discover to Operate with human sign-offs, bounded loops and evidence-based verification
- **Zero-Config Install** - Run once, works everywhere
- **Curated Bundles** - Install exactly what you need
- **Smart Search** - Find skills by keyword
- **8 Platform Support** - GitHub Copilot, Claude Code, Codex, OpenCode, Gemini, Antigravity, Cursor, AdaL
- **Discovery & Orchestration** - Find and plan with available resources
- **Command Shortcuts** - `i`, `ls`, `up`, `rm`, `doc`
- **Short Flags** - `-a`, `-y`, `-q`

## 📦 Available Skills

### 🔁 Agentic SDLC
| Skill | Version | Stage | Purpose |
|-------|---------|-------|---------|
| **agentic-sdlc** | v2.1.0 | Router | Scrum Master router: detects state, scores the path (Quick, Standard, Full), hands each stage to its agent and skills, enforces the 4 human sign-offs |
| **issue-triage** | v1.0.0 | Discover | Turns an incoming item into a decision-ready intake record: duplicate search, classification, path score, indicator |
| **project-context** | v1.2.0 | Discover | Verified starting context for every agent session: commands, `sdlc-dod` Definition of Done, code map, conventions, pitfalls |
| **brainstorming** | v3.1.0 | Discover | Pre-implementation design clarification before any spec or code |
| **spec-driven-development** | v2.1.0 | Specify | Writes `specs/NNN-slug/spec.md` with numbered acceptance criteria, non-goals, security notes, rollback and indicator |
| **grill-me** | v2.2.0 | Specify | Relentless Socratic interview to stress-test a spec, plan or design |
| **codebase-modernization** | v1.0.0 | Specify, Design | Brownfield work: inventory, dependency map, characterization tests and safe migration slices |
| **security-hardening** | v1.0.0 | Specify, Test | Data classification, STRIDE threat model, secure-build guidance and security review |
| **senior-solution-architect** | v2.3.0 | Design | C4 modeling, ADRs and system reviews |
| **writing-plans** | v3.2.0 | Design | `plan.md` task graph of vertical slices with dependencies and files, validated by `plan-graph` |
| **executing-plans** | v4.0.0 | Build | Executes plan tasks one per fresh context, test-first, with per-task review and a run ledger |
| **test-driven-development** | v1.0.0 | Build | Red-green-refactor under the iron law: no production code before a failing test |
| **systematic-debugging** | v1.0.0 | Build | Proven root cause inside a bounded debug loop of falsifiable hypotheses |
| **test-strategy** | v1.0.0 | Test | Acceptance tests designed from the spec by a context that never saw the implementation |
| **verification-gate** | v1.0.0 | Test | Turns completion claims into fresh, fingerprinted evidence |
| **multi-axis-code-review** | v1.0.0 | Test | Independent review on five axes through four fresh-context lenses, with Critical/Important/Minor triage |
| **deployment-pipeline** | v1.0.0 | Release | Makes CI enforce the Definition of Done and approval checks; staged rollout and rehearsed rollback |
| **shipping-and-handover** | v1.0.0 | Release | Pre-ship checklist, PR body with evidence, release notes and runbook handover |
| **operations-and-incidents** | v1.0.0 | Operate | Ops record, SLIs and SLOs from the spec, release watch, incidents and postmortems |
| **retrospective** | v1.0.0 | Operate | Evidence-based retro record with owned actions; feeds new work back to Discover |

### 🔍 Discovery & Orchestration
| Skill | Version | Purpose |
|-------|---------|---------|
| **agent-skill-discovery** | v2.1.0 | Scan installed resources and current repository resources (agents, skills, MCPs) |
| **agent-skill-orchestrator** | v2.2.0 | Intelligent task planning with resource matching; proposes the Agentic SDLC router for software-delivery requests |

### 🛠️ Development & Automation
| Skill | Version | Purpose |
|-------|---------|---------|
| **skill-creator** | v2.1.0 | Automate skill creation with guided workflow |
| **prompt-engineer** | v2.0.0 | Optimize prompts using 11 frameworks (RTF, RISEN, Chain of Thought, etc.) |

### 🧭 Strategy
| Skill | Version | Purpose |
|-------|---------|---------|
| **mckinsey-strategist** | v2.1.0 | Senior strategy consulting with SWOT, VRIO, 7S and First Principles analysis |

### 🔬 Research & Analysis
| Skill | Version | Purpose |
|-------|---------|---------|
| **deep-research** | v2.3.0 | Dense multi-step research workflow with sub-question decomposition, parallel agents, frontier-model recommendation, evidence ledger, citations, and confidence/gap analysis |
| **us-program-research** | v2.0.0 | Structured US academic program research, ranking, and application action-plan generation |
| **webpage-reader** | v1.0.0 | Extract clean Markdown from any URL using the Defuddle CLI. Supports metadata-only mode, batch URLs, and saving output to file |

### 📝 Content Processing
| Skill | Version | Purpose |
|-------|---------|---------|
| **youtube-summarizer** | v2.1.0 | Extract YouTube transcripts and generate comprehensive summaries |
| **audio-transcriber** | v2.1.0 | Transform audio recordings into professional Markdown documentation |
| **pptx-translator** | v2.8.0 | Translate PowerPoint presentations between languages with batched parallel translation, group shape support, and per-slide self-validation |
| **document-converter** | v1.0.0 | Convert Office documents to PDF, perform PDF operations (merge, split, rotate, encrypt, OCR) using local free tools — LibreOffice, ghostscript, pdftk, tesseract, imagemagick |
| **storytelling-expert** | v2.0.0 | Transform ideas into engaging narratives using 8 elite storytelling frameworks |

## 🎯 Curated Bundles

```bash
# Essential Skills (recommended for beginners)
npx claude-superskills --bundle essential -y

# Agentic SDLC (router + 19 stage skills, Discover → Operate)
npx claude-superskills --bundle agentic-sdlc -y

# Content Creation (video & audio)
npx claude-superskills --bundle content -y

# Planning & Execution
npx claude-superskills --bundle planning -y

# Research & Analysis
npx claude-superskills --bundle research -y

# Discovery & Orchestration
npx claude-superskills --bundle orchestration -y

# All Skills (complete collection)
npx claude-superskills --bundle all -y
```

See [Bundles Guide](bundles/bundles.md) for details.

## 🔍 Search Skills

```bash
npx claude-superskills --search "prompt"
npx claude-superskills --search "video"
```

## 🚀 Quick Start Examples

### Discovery & Planning Workflow

```bash
# 1. Discover what's available
claude  # or: gh copilot, gemini, opencode, codex
> "What do I have installed?"

# Output: Lists installed and current-repository plugins, skills, MCPs

# 2. Get intelligent execution plan
> "Plan how to build a REST API with authentication"

# Output: Detailed strategy using best available resources with confidence scores
```

### Agentic SDLC Workflow

```bash
claude  # or: gh copilot, gemini, opencode, codex, cursor
> "Use agentic-sdlc to fix issue #42"

# The router scores the path, runs Discover → Specify → Design → Build → Test,
# stops at each human sign-off and proves every acceptance criterion with fresh evidence
```

### Other Use Cases

```bash
# Create a new skill
gh copilot -p "create a skill for PDF processing"

# Optimize a prompt
claude -p "improve this prompt: create REST API"

# Process content
gh copilot -p "transcribe this audio file: meeting.mp3"

# Orchestrate complex tasks
gemini -p "design a solution for processing meeting notes and creating Jira tickets"
```

## 💻 Supported Platforms

- **GitHub Copilot CLI** - Terminal AI assistant (`~/.copilot/skills/`)
- **Claude Code** - Anthropic's Claude in development (`~/.claude/skills/`)
- **OpenAI Codex** - GPT-powered coding assistant (`~/.codex/skills/`)
- **OpenCode** - Open source AI coding assistant (`~/.agent/skills/`)
- **Gemini CLI** - Google's Gemini in terminal (`~/.gemini/skills/`)
- **Antigravity** - AI coding assistant (`~/.gemini/antigravity/skills/`)
- **Cursor IDE** - AI-powered code editor (`~/.cursor/skills/`)
- **AdaL CLI** - AI development assistant (`~/.adal/skills/`)

**Note on Codex:** The installer uses `~/.codex/skills/` for Codex CLI + App, with cleanup support for legacy `~/.agents/skills/`.

## ⌨️ Compatibility & Invocation

These skills follow the universal `SKILL.md` format and work with any AI coding assistant that supports agentic skills.

| Tool | Type | Invocation Example | Path |
|------|------|--------------------|------|
| **Claude Code** | CLI | `/skill-name help me...` | `~/.claude/skills/` |
| **Gemini CLI** | CLI | `Use skill-name to...` | `~/.gemini/skills/` |
| **Codex CLI** | CLI | `Use skill-name to...` | `~/.codex/skills/` |
| **Antigravity** | IDE | *(Agent Mode)* `Use skill...` | `~/.gemini/antigravity/skills/` |
| **Cursor** | IDE | `@skill-name` in Chat | `~/.cursor/skills/` |
| **Copilot** | Ext | *(Paste skill content manually)* | N/A |
| **OpenCode** | CLI | `opencode run @skill-name` | `~/.agent/skills/` |
| **AdaL CLI** | CLI | *(Auto)* Skills load on-demand | `~/.adal/skills/` |

> **Tip:** OpenCode uses `~/.agent/skills/`; Antigravity uses `~/.gemini/antigravity/skills/`.

## 📚 Documentation

- **[Getting Started](guides/getting-started.md)** - First-time user guide
- **[Agentic SDLC Guide](guides/agentic-sdlc.md)** - Stages, sign-offs, agents, paths, artifacts, standards mapping
- **[Skill Anatomy](guides/skill-anatomy.md)** - How skills work
- **[Bundles Guide](bundles/bundles.md)** - Curated collections
- **[Quality Standards](guides/quality-standards.md)** - Best practices
- **[Full Catalog](../CATALOG.md)** - Complete skill listing

## ⚡ CLI Commands & Shortcuts

| Command | Shortcut | Purpose |
|---------|----------|---------|
| `install` | `i` | Install skills |
| `list` | `ls` | List installed skills |
| `status` | `st` | Show global install status + version differences |
| `update` | `up` | Smart update (outdated + missing skills) |
| `uninstall` | `rm` | Remove skills |
| `doctor` | `doc` | Check installation |

```bash
npx claude-superskills i -a -y -q    # Install all, skip prompts, quiet mode
npx claude-superskills status         # Show global status + skill version differences
npx claude-superskills up -y          # Update outdated + install missing skills
npx claude-superskills ls -q          # List with minimal output
npx claude-superskills --list-bundles # Show available bundles
```

## 📋 System Requirements

- Node.js 14+ (for installer)
- One or more supported platforms installed
- Python 3.8+ (for some skills with dependencies)

## 🤝 Contributing

We welcome contributions! Check [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

- Create new skills using the [skill-creator](https://github.com/ericgandrade/claude-superskills) skill
- Follow [Quality Standards](guides/quality-standards.md)
- Report issues and suggestions

## 🔒 Privacy

claude-superskills does not collect, store, transmit, or share any user data.

- **No external servers** — the plugin has no backend, no telemetry, and no network requests of its own
- **No API keys required** — all skills run entirely within Claude Code using Claude's native tools (WebSearch, WebFetch, Bash, Read/Write)
- **No logging** — nothing is recorded outside of your local Claude Code session
- **Open source** — all skill logic is fully auditable at [github.com/ericgandrade/claude-superskills](https://github.com/ericgandrade/claude-superskills)

Any web searches or document fetches performed by skills use Claude Code's built-in tools, subject to Anthropic's own privacy policy.

## 📄 License

MIT - See [LICENSE](../LICENSE) for details.

## 🔗 Quick Links

- 📚 [Full Catalog](../CATALOG.md) - All skills with metadata
- 🛠️ [Skills Development Guide](../resources/skills-development.md) - Create custom skills
- 📝 [Changelog](../CHANGELOG.md) - Release history
- 🐛 [Issues](https://github.com/ericgandrade/claude-superskills/issues) - Report problems
- 💬 [Discussions](https://github.com/ericgandrade/claude-superskills/discussions) - Share ideas

---

**Built with ❤️ by [Eric Andrade](https://github.com/ericgandrade)**


## 🎁 Get Started

Choose a bundle that fits your workflow:

- **[Essential](bundles/bundles.md#essential)** - agentic-sdlc, skill-creator, prompt-engineer, agent-skill-discovery, agent-skill-orchestrator, brainstorming, writing-plans, executing-plans, grill-me
- **[Agentic SDLC](bundles/bundles.md#agentic-sdlc)** - router + 19 stage skills, Discover → Operate
- **[Planning](bundles/bundles.md#planning)** - brainstorming, spec-driven-development, project-context, writing-plans, executing-plans, grill-me, agent-skill-orchestrator
- **[Research](bundles/bundles.md#research)** - deep-research, us-program-research, senior-solution-architect, webpage-reader, prompt-engineer
- **[Content](bundles/bundles.md#content)** - youtube-summarizer, audio-transcriber, pptx-translator, document-converter, storytelling-expert
- **[Orchestration](bundles/bundles.md#orchestration)** - agent-skill-discovery, agent-skill-orchestrator
- **[All](bundles/bundles.md#all)** - Complete 33-skill toolkit

See [detailed comparison](bundles/bundles.md#bundle-comparison).

## 🛠️ Advanced Usage

- **[Skill Anatomy](guides/skill-anatomy.md)** - How to build skills
- **[Skills Development](../resources/skills-development.md)** - Advanced creation
- **[Changelog](../CHANGELOG.md)** - Version history

## Part of the Superskills Family

| Package | Skills | Focus | Install |
|---------|--------|-------|---------|
| **claude-superskills** | 33 | Core: Agentic SDLC, orchestration, planning, research & content | `npx claude-superskills` |
| [obsidian-superskills](https://github.com/ericgandrade/obsidian-superskills) | 6 | Obsidian knowledge management | `npx obsidian-superskills` |
| [career-superskills](https://github.com/ericgandrade/career-superskills) | 20 | Job search & career development | `npx career-superskills` |
| [product-superskills](https://github.com/ericgandrade/product-superskills) | 8 | Product management & GTM strategy | `npx product-superskills` |
| [design-superskills](https://github.com/ericgandrade/design-superskills) | 9 | UI/UX design, brand & diagrams | `npx design-superskills` |
| [avanade-superskills](https://github.com/ericgandrade/avanade-superskills) | 3 | Avanade-branded content (private) | `git clone git@github.com:ericgandrade/avanade-superskills.git` |

---

**Getting Started? Check [Quick Start](guides/getting-started.md) or run `npx claude-superskills` now!**
