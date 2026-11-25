# 📦 Curated Skill Bundles

Bundles are curated collections of skills grouped by use case. They are defined in [`bundles.json`](../../bundles.json) at the repository root, which is the source of truth for this page. Install one with:

```bash
npx claude-superskills --bundle <name> -y
npx claude-superskills --list-bundles   # show all bundles
```

A skill can belong to several bundles.

> The `research` and `content` bundles were removed: research, content and document skills moved to [knowledge-superskills](https://github.com/ericgandrade/knowledge-superskills).

---

## Essential

**Bundle:** `essential` · **Skills:** 8 · **For:** All users

Core skills for orchestration, planning, skill creation, and the Agentic SDLC router.

**Includes:** `agentic-sdlc`, `skill-creator`, `agent-skill-discovery`, `agent-skill-orchestrator`, `brainstorming`, `writing-plans`, `executing-plans`, `grill-me`

```bash
npx claude-superskills --bundle essential -y
```

---

## Agentic SDLC

**Bundle:** `agentic-sdlc` · **Skills:** 20 · **For:** Developers, tech leads, product owners, regulated teams

End-to-end AI-assisted software delivery: router plus 19 stage skills from Discover to Operate, with human sign-offs, bounded loops and evidence-based verification.

| # | Skill | Stage |
|---|-------|-------|
| 1 | `agentic-sdlc` | Router |
| 2 | `issue-triage` | Discover |
| 3 | `project-context` | Discover |
| 4 | `brainstorming` | Discover |
| 5 | `spec-driven-development` | Specify |
| 6 | `grill-me` | Specify |
| 7 | `codebase-modernization` | Specify (brownfield), Design |
| 8 | `security-hardening` | Specify (threat model), Test |
| 9 | `senior-solution-architect` | Design |
| 10 | `writing-plans` | Design |
| 11 | `executing-plans` | Build |
| 12 | `test-driven-development` | Build |
| 13 | `systematic-debugging` | Build |
| 14 | `test-strategy` | Test |
| 15 | `verification-gate` | Test |
| 16 | `multi-axis-code-review` | Test |
| 17 | `deployment-pipeline` | Release |
| 18 | `shipping-and-handover` | Release |
| 19 | `operations-and-incidents` | Operate |
| 20 | `retrospective` | Operate |

The router plays the Scrum Master and hands each stage to its agent and skills. Human sign-offs: Product Owner (Specify), Tech Lead (Design), human reviewer (Test), Release Owner (Release). Start with the [Quickstart](../../skills/agentic-sdlc/references/quickstart.md); reference: [Agentic SDLC Guide](../guides/agentic-sdlc.md).

```bash
npx claude-superskills --bundle agentic-sdlc -y
```

---

## Planning

**Bundle:** `planning` · **Skills:** 7 · **For:** Developers, architects

Full planning and execution workflow.

**Includes:** `brainstorming`, `spec-driven-development`, `project-context`, `writing-plans`, `executing-plans`, `grill-me`, `agent-skill-orchestrator`

```bash
npx claude-superskills --bundle planning -y
```

---

## Orchestration

**Bundle:** `orchestration` · **Skills:** 2 · **For:** Power users, AI builders

Skill discovery and orchestration.

**Includes:** `agent-skill-discovery`, `agent-skill-orchestrator`

```bash
npx claude-superskills --bundle orchestration -y
```

---

## All

**Bundle:** `all` · **Skills:** 23 · **For:** All users

Complete claude-superskills toolkit — all 23 skills.

Every skill in `skills/`: the 20 Agentic SDLC skills plus `agent-skill-discovery`, `agent-skill-orchestrator` and `skill-creator`.

```bash
npx claude-superskills --bundle all -y
```

---

## Bundle Comparison

| Bundle | Skills | Best for |
|--------|--------|----------|
| `essential` | 8 | All users |
| `agentic-sdlc` | 20 | Developers, tech leads, product owners, regulated teams |
| `planning` | 7 | Developers, architects |
| `orchestration` | 2 | Power users, AI builders |
| `all` | 23 | All users |

### Skill membership

| Skill | `essential` | `agentic-sdlc` | `planning` | `orchestration` |
|-------|:-:|:-:|:-:|:-:|
| `skill-creator` | ✅ |  |  |  |
| `agent-skill-discovery` | ✅ |  |  | ✅ |
| `agent-skill-orchestrator` | ✅ |  | ✅ | ✅ |
| `agentic-sdlc` | ✅ | ✅ |  |  |
| `issue-triage` |  | ✅ |  |  |
| `project-context` |  | ✅ | ✅ |  |
| `brainstorming` | ✅ | ✅ | ✅ |  |
| `spec-driven-development` |  | ✅ | ✅ |  |
| `grill-me` | ✅ | ✅ | ✅ |  |
| `codebase-modernization` |  | ✅ |  |  |
| `security-hardening` |  | ✅ |  |  |
| `senior-solution-architect` |  | ✅ |  |  |
| `writing-plans` | ✅ | ✅ | ✅ |  |
| `executing-plans` | ✅ | ✅ | ✅ |  |
| `test-driven-development` |  | ✅ |  |  |
| `systematic-debugging` |  | ✅ |  |  |
| `test-strategy` |  | ✅ |  |  |
| `verification-gate` |  | ✅ |  |  |
| `multi-axis-code-review` |  | ✅ |  |  |
| `deployment-pipeline` |  | ✅ |  |  |
| `shipping-and-handover` |  | ✅ |  |  |
| `operations-and-incidents` |  | ✅ |  |  |
| `retrospective` |  | ✅ |  |  |

Every skill is in `all`.

---

## Which Bundle?

- **Shipping software with AI agents and human sign-offs** → `agentic-sdlc`
- **New to the library** → `essential` (includes the Agentic SDLC router)
- **Planning a change before building it** → `planning`
- **Finding and combining installed resources** → `orchestration`
- **Everything** → `all`
