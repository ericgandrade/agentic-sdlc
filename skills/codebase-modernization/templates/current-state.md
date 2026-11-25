# Current state — <NNN-slug>

<!-- Created by codebase-modernization Step 4. Describes the code at one commit; no recommendations.
     Contract: skills/agentic-sdlc/references/brownfield.md §1–§2. Synthetic examples only. -->

| Item | Value |
|---|---|
| Base commit | `<sha12>` |
| Researched | <YYYY-MM-DD> |
| Modules in scope | <code map module names and paths> |
| Excluded from reading | specs/, docs/plans/, Proposed ADRs, issue and PR text, design notes |
| Passes | <subagents: locator, analyzer, historian, verifier · or labels: research pass, verification pass> |
| Freshness check | `git diff --name-only <sha12>..HEAD -- <cited paths>` → <empty | paths re-verified on YYYY-MM-DD @ <new sha12>> |

## Questions

<!-- 3–7 factual questions. None names the intended change. One "how tested" per touched module. -->

| ID | Shape | Question |
|---|---|---|
| Q1 | how | <How does … work today, from entry to effect?> |
| Q2 | what touches | <What reads or writes …?> |
| Q3 | how tested | <Which tests execute …, and what do they assert?> |

## Answers

### Q1 <question>

- <claim> — `<path:line @ sha12>` <✓ | disputed | unverified>
- <claim> — `<sha12> "<commit subject>"` <✓>

Files read: <n>/15

### Q2 <question>

- <claim> — `<citation>`

### Q3 <question>

- <claim> — `<citation>`
- Coverage of touched files at base: `<command>` → <file: n% lines> …

## Known defects observed

<!-- Behaviour that looks wrong, recorded, not fixed. Each gets an issue; its CHAR test pins it. -->

| Behaviour | Citation | Issue | In scope of this work item |
|---|---|---|---|
| <…> | `<path:line @ sha12>` | #<n> | <no — non-goal line in spec | yes — AC-n> |

## Verification

Sample: all load-bearing claims + <n>% of others (<method>).
Summary: verified <n> · disputed <n> · overturned <n> · unverified <n>
Pass: <verifier subagent | verification pass label>

## CHAR register

<!-- One row per CHAR-n test. Status: active · superseded by AC-n · retired with AC-n.
     A row changes only in the PR whose commit carries that AC (brownfield.md §1 rule 4). -->

| ID | Behaviour pinned | Citation | Pins bug | Protects | Mutation proof | Status |
|---|---|---|---|---|---|---|
| CHAR-<n> | <observable behaviour> | `<path:line @ sha12>` | <#n | —> | <AC-n | —> | <mutated line → failing assertion> | active |

Lines modified by the plan executed by ≥ 1 test: <n>/<n> (target 100%). Missing seams: <none | path:line — NEEDS_CONTEXT to Planner on YYYY-MM-DD>

## Open questions for the Architect

- <design question> — prompted by `<citation>`
