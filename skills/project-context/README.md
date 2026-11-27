# project-context

Discover-stage foundation of the **Agentic SDLC**, kept current every cycle: gives every agent session in a repository the same verified starting context — commands, the required `sdlc-dod` Definition of Done, the code map, conventions, the quality bar, domain vocabulary and known agent pitfalls — vendors the gate scripts into `.agentic-sdlc/bin/` with `VERSION` and `SHA256SUMS`, and keeps the adoption ledger that shows how far the team has rolled out the method. Used by the Analyst and Architect (code map, glossary), the Tech Writer (instruction file and relocated docs), the Scrum Master agent (adoption ledger) and the Release Engineer (CI enforcement inputs).

## When to use

- Set up, adopt, refresh or audit the AGENTIC-SDLC block in `AGENTS.md` (or `CLAUDE.md`), including the `sdlc-dod` block that `preflight` and CI read.
- Enter an existing codebase before the first change (adopt: baseline run, conventions, `docs/codemap.md`, mapping of Spec Kit, Kiro, OpenSpec, AI-DLC, BMad or ADR folders).
- Clean up a long or stale instruction file without losing rules (instruction audit with deletion grounds).
- Vendor or re-vendor the gate scripts after an install or upgrade; investigate a checksum failure.
- Write `CONSTRAINTS.md` with floor-guard checks agents cannot quietly weaken.
- Build `GLOSSARY.md` when domain words are ambiguous.
- Prepare the CI template values and record enforcement proof before switching to `Enforcement: branch-protection`.
- Record an agent mistake so the next session avoids it.

Not for writing ADRs (`senior-solution-architect`), installing CI and branch protection (`deployment-pipeline`), holding the retro (`retrospective`), legacy characterization and migration (`codebase-modernization`) or end-user documentation.

## What is included

- `SKILL.md` — modes: setup, adopt, refresh, audit, codemap, vendor, enforce, constraints, glossary, pitfall; Steps 0–9; anti-rationalization table
- `references/agents-md-rules.md` — admission test, block lines and their sources, one-copy rule, budgets (block 60, file 200, line 160), deletion grounds G1–G6, instruction audit
- `references/dod-block.md` — the four parsers of `sdlc-dod` and the format that satisfies all of them; key values; examples for Node, Python, Go, .NET, Java; CI-parser self-check; floor measurement
- `references/constraints-md.md` — Floor, Enforced with numbers, Ratchets, Exceptions; floor-guard diff checks; prove-the-gate; loosening rules
- `references/glossary-and-adr.md` — glossary entry format and rules; ADR format and the three-condition filter for retroactive ADRs
- `references/vendoring.md` — copy set, `VERSION` and `SHA256SUMS`, verification, update procedure, Windows and no-vendoring fallbacks
- `references/adoption-ledger.md` — `.agentic-sdlc/adoption.md` sections, existing-artifact mapping, rollout rows, stall signals
- `references/enforcement-setup.md` — CI template values, CODEOWNERS lines, evidence required for each `Enforcement:` value
- `prompts/context-scan.md`, `prompts/instruction-audit.md` — fresh-context read-only passes with no-subagent fallback
- `templates/agents-md-block.md`, `templates/CONSTRAINTS.md`, `templates/GLOSSARY.md`, `templates/adoption.md`, `templates/adr.md`
- `evals/evals.json` — 6 scenarios (setup, constraints, adopt, README-dump pressure, coverage-floor pressure, checksum failure)
- `evals/trigger-eval.json` — 20 trigger queries (12 positive, 8 negative)
- Uses from `agentic-sdlc`: `references/artifacts.md`, `adoption.md`, `platforms.md`, `governance.md`, `verification.md`, `rules.md`, `security.md`, `paths.md`, `brownfield.md`, `retrospective.md`; `templates/codemap.md`, `templates/ci/*.yml`, `templates/CODEOWNERS`; `scripts/preflight.mjs`, `scripts/run-ledger.mjs`

## Typical invocation

- "Set up agent instructions for this repo."
- "Adopt the Agentic SDLC on our service — we already use Kiro steering files."
- "Our CLAUDE.md is 400 lines; clean it up without losing rules."
- "CI says there is no sdlc-dod block."
- "Agents keep adding ts-ignore — write a quality bar."
- "Record this mistake so it doesn't happen again."

## What's New in 1.3.0

- Step 7b: setup and adopt install the day-1 CI gates (`agentic-sdlc/dod`, `spec`, `approvals`, `security.yml`, CODEOWNERS) with write access only; branch protection stays in week 3.
- `upgrade` mode (`adopt --upgrade`) for repositories adopted before 3.1.
- Setup, adopt and refresh end with `doctor`; vendoring adds the `status.mjs` data files.

## What's New in 1.2.0

- Depth pass to the Agentic SDLC standard: seven reference files, two fresh-context prompts, five templates.
- `sdlc-dod` guidance now matches all four parsers exactly (`preflight`/`run-ledger`, GitHub and GitLab CI templates): column-0 fence, exactly five keys, lower-case `n/a — reason`, no extra keys.
- Deletion grounds G1–G6 and the instruction audit; budgets for block, file and line; pressure handling for "paste the README".
- Adoption ledger at `.agentic-sdlc/adoption.md` with existing-artifact mapping (Spec Kit constitution, Kiro steering, OpenSpec, AI-DLC, BMad) and stall signals for the Scrum Master agent.
- Enforce mode: CI template values, CODEOWNERS lines, proof required before `Enforcement: branch-protection`.
- Floor-guard diff checks and prove-the-gate for `CONSTRAINTS.md`; ADR three-condition filter for retroactive ADRs.
- Vendoring update procedure, Windows fallback, `missing:` line; anti-rationalization table; References with load triggers.

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| BM-80 | BMad Method (MIT) | Verified agent-instructions block with markers, provenance SHA and admission rules | AGENTIC-SDLC block with `Verified:` line, admission test and budgets; pitfalls only from observed mistakes |
| BM-81 | BMad Method (MIT) | Ledger-based adoption, deletion grounds, record and audit modes | Instruction audit with decisions retain/rewrite/relocate/automate/delete and grounds G1–G6; summary kept in the adoption ledger |
| BM-14 | BMad Method (MIT) | Investigate before asking; code map as the investigation's landing place | Step 1 context scan before any question; `docs/codemap.md` from the `sdlc-codemap` template |
| MP-07 | Matt Pocock — skills (MIT) | Explore → present → confirm → write setup | Step 9: show everything, end the turn, write only after an explicit yes |
| MP-08 | Matt Pocock — skills (MIT) | Single instruction file with an in-place block | One copy in `AGENTS.md`; pointer lines in every other instruction file |
| MP-12 | Matt Pocock — skills (MIT) | Context pointers instead of pasted content | "Paste the README" answered with ≤ 10 admitted lines plus a pointer |
| MP-23 | Matt Pocock — skills (MIT) | GLOSSARY.md format with aliases to avoid and flagged ambiguities | Definition · Avoid · Example · Source entries; `## Open questions` with owner and blocked AC |
| MP-24 | Matt Pocock — skills (MIT) | ADR three-condition test and minimal format | Filter for retroactive ADR candidates during adopt; new decisions keep the contract trigger |
| MP-74 | Matt Pocock — skills (MIT) | Retro fixes the environment, not only the code | Pitfall lines plus a proposed check; recurring cause tags must get the check |
| AO-18 | Addy Osmani — agent-skills (MIT) | Detect-before-ask repository scan | `prompts/context-scan.md` with evidence per finding |
| AO-19 | Addy Osmani — agent-skills (MIT) | Four-question quality-bar interview with defaults | Constraints mode: four questions, each with a working default |
| AO-20, AO-27 | Addy Osmani — agent-skills (MIT) | CONSTRAINTS.md contract; ratchets and sane-default thresholds | Floor · Enforced with numbers · Ratchets · Exceptions with owner ≠ requester and expiry ≤ 30 days |
| AO-23, AO-26 | Addy Osmani — agent-skills (MIT) | Prove the gate; floor-guard reference implementation | Diff-only floor guard F1–F5 wired into the `lint` key; one red and one green run recorded |
| AO-24, AO-28 | Addy Osmani — agent-skills (MIT) | Bar-weakening guard; escalation written → scripted → tool-backed | Never-lower rules for `coverage_min` and the DoD; prose rules converted to checks (G4) |
| AO-25 | Addy Osmani — agent-skills (MIT) | External vs project-suite circularity | ≥ 1 external check required in `CONSTRAINTS.md` |
| AO-55, AO-63 | Addy Osmani — agent-skills (MIT) | Context hierarchy; documentation drift by commit order | Always-loaded block vs on-demand references; audit by `git log <Verified SHA>..HEAD` |
| AO-62 | Addy Osmani — agent-skills (MIT) | Convention-first ADR practice | Keep existing ADR folders and numbering; template handed to `senior-solution-architect` |
| AO-102 | Addy Osmani — agent-skills (MIT) | Definition of Done as a standing bar separate from acceptance criteria | Five-key `sdlc-dod` block read by `preflight`, CI and every agent |
| AO-118 | Addy Osmani — agent-skills (MIT) | Greenfield vs brownfield adoption paths | Setup vs adopt modes; adopt is a superset and blocks code changes until done |
| SP-05, SP-07 | Superpowers (MIT) | Instruction-file hygiene; look before asking | Line budgets and admission test; ≤ 5 gap questions, one at a time |
| — (`docs/research/methods/ai-native-methods.md` §2.1) | GitHub Spec Kit (MIT) | Constitution set once per project | Constitution principles mapped to `CONSTRAINTS.md` floor rules or evidenced conventions; file kept read-only |
| — (§2.2) | AWS Kiro (concepts from public docs) | Steering files product / tech / structure | Mapped to glossary, verified DoD commands and the code map; steering files get the pointer line |
| — (§2.3) | AWS AI-DLC workflows (MIT-0) | Reverse Engineering (brownfield) and Practices Discovery before Inception | Adopt mode: baseline, conventions and code map before the first change; AI-DLC units mapped to spec folders in the adoption ledger |

Script vendoring with `VERSION` and `SHA256SUMS`, the four-parser DoD format and the adoption ledger are original to this method.

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 1.3.0 |
| Author | Eric Andrade |
| Created | 2026-11-19 |
| Updated | 2026-11-27 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | development |
| Tags | agentic-sdlc, agents-md, claude-md, definition-of-done, constraints, glossary, adoption, context-engineering |
| Risk | safe |
