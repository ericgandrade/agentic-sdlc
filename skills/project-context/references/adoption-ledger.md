# Adoption ledger — `.agentic-sdlc/adoption.md`

Load in adopt mode, at each week boundary of the rollout, when existing Spec Kit, Kiro, OpenSpec, AI-DLC, BMad or ADR folders are found, when an enforcement control changes, and when the Scrum Master agent checks whether adoption is stalling. Contract: `../../agentic-sdlc/references/adoption.md` (§1 before week 1, §2 three-week rollout, §3 existing folders, §6 stall signals). Template: `../templates/adoption.md`.

## 1. Purpose and location

The adoption ledger records **what was adopted, when, by whom, and on what evidence**, so the team can answer "where are we in the rollout?" without reconstructing it from PRs. It is append-mostly: rows are added; a row is corrected only by a later row that cites it.

- **File:** `.agentic-sdlc/adoption.md`. Under `.agentic-sdlc/**`, it inherits the CODEOWNERS rule (`.agentic-sdlc/** @tech-leads`) and is never touched by a re-vendor (only `bin/` is replaced).
- **Writer:** this skill (adopt, setup, refresh, audit, vendor and enforce modes) after the user approves each change. Humans may add `Events` rows directly.
- **Readers:** the Scrum Master agent (rollout position and stall signals at each retro), the Tech Lead (enforcement state), the Release Engineer (which CI gates are proven), the Analyst (artifact mapping).
- **Not a copy of the block.** The block says what is true now; the ledger says how and when it became true. The block's `Artifacts:`, `Roles:`, `Enforcement:` and `Tools:` lines are the current state; the ledger links each to the row that set it.

## 2. Sections

| Section | One row per | Columns |
|---|---|---|
| `## Approvers` | Role holder | Role (Product Owner · Tech Lead · Reviewer · Release Owner) · Name or handle · Since · Recorded by |
| `## Rollout` | Week layer (`adoption.md` §2) | Week · Scope · Started · Exit check · Evidence (PR links, retro file) · Passed on · Confirmed by |
| `## Existing artifacts` | Convention found (`adoption.md` §3) | Tool · Files found · Mapped to · Added to the existing files · Authoritative? · Decided by |
| `## Instruction ledger summary` | Adopt, refresh or audit run | Date · Files audited · retained / rewritten / relocated / automated / deleted · Approved by · Deleted lines with grounds (G1–G6, `agents-md-rules.md` §4) |
| `## Enforcement` | Control (`../../agentic-sdlc/references/governance.md` §7) | Control · State (`absent` · `installed` · `proven`) · Proof (red run link + green run link) · Date · Owner |
| `## Baseline` | Measurement | Date · SHA · Tests pass/total · Coverage % · Red test IDs · `baseline-red` issues |
| `## Retroactive ADR candidates` | Past decision passing the three-condition filter (`glossary-and-adr.md` §2) | Decision · Evidence · Owner (Architect) · ADR number or `pending` |
| `## Events` | Anything else that changed adoption | Date · Event (vendor, upgrade, platform probe change, waiver, rollback of a layer) · Detail · By |

## 3. Mapping existing artifact folders

Run during Step 1 discovery of adopt mode. The rule from `../../agentic-sdlc/references/adoption.md` §3 holds: exactly one convention found → keep the files where they are and map them; never create a parallel `specs/` tree; two or more → ask which is authoritative, record the answer, the others stay read-only.

| Found | Detect with | Map | Block `Artifacts:` line |
|---|---|---|---|
| Spec Kit | `specs/NNN-*/spec.md` + `plan.md` + `tasks.md`; `.specify/memory/constitution.md` | Same paths; `tasks.md` rows → `## Tasks` of `plan.md` or a link | `specs/NNN-slug/ (Spec Kit layout)` |
| Spec Kit constitution | `.specify/memory/constitution.md` or `memory/constitution.md` | Each principle → a `CONSTRAINTS.md` floor rule when checkable, a convention line with evidence otherwise, or `delete` with a ground; the constitution file stays read-only | `Quality bar: CONSTRAINTS.md (from constitution)` |
| Kiro specs | `.kiro/specs/<feature>/requirements.md`, `design.md`, `tasks.md` | `requirements.md` = spec, `design.md` + `tasks.md` = plan; EARS stays valid, add `AC-n` | `.kiro/specs/<feature>/` |
| Kiro steering | `.kiro/steering/product.md`, `tech.md`, `structure.md`, custom steering files | `product.md` → README pointer and `GLOSSARY.md` terms; `tech.md` → `Build:`/DoD commands after verification; `structure.md` → `docs/codemap.md`; every steering line goes through the instruction audit | Pointer line in a steering file: `Read AGENTS.md first; the AGENTIC-SDLC block is authoritative.` |
| OpenSpec | `openspec/changes/<id>/proposal.md`, `tasks.md`, `openspec/specs/` | Proposal + deltas = spec revision; `tasks.md` = plan tasks | `openspec/changes/<id>/` |
| AWS AI-DLC | `aidlc-docs/` (2025 layout) or `aidlc/spaces/<space>/intents/` (workflows v2) with units of work | Unit of work = one `specs/NNN-slug/` item; inception requirements = spec; construction plan = plan | `specs/NNN-slug/ (from aidlc-docs units)` |
| BMad | PRD, architecture document, epics and story files (`docs/prd.md`, `docs/architecture.md`, `docs/stories/`) | PRD capability → spec; architecture → ADR candidates + plan design notes; story → plan task or Quick item | `specs/NNN-slug/`; PRD and architecture read-only |
| ADR folder | `docs/adr/`, `adr/`, `docs/decisions/` | Keep folder and numbering | `ADRs: <folder>` |

Each mapping row records what was **added** to the existing files (`## Approvals`, `AC-n`, rollback and observability sections), never what was moved. Moving files is a separate, approved change.

## 4. Rollout rows and stall signals

Each week from `adoption.md` §2 gets one `Rollout` row when it starts and its `Passed on` cell when its exit check holds:

| Week | Exit check evidence the ledger cites |
|---|---|
| 1 — Quick | ≥ 3 merged Quick PR links with fresh Verification output; the batched retro file |
| 2 — Standard | The spec folder of the item that reached Operate; `spec-lint --check-approval` and `plan-graph --check --check-approval` output |
| 3 — CI gates | `Enforcement` rows for `agentic-sdlc/dod`, `agentic-sdlc/spec`, `agentic-sdlc/approvals`, CODEOWNERS and branch protection, each `proven` |

A week does not start before the previous row has `Passed on`. The Full path, unattended mode, extensions and metrics stay off until week 3 passes (mechanism 1.4).

The Scrum Master agent compares the ledger with `adoption.md` §6 at each retro:

| Ledger signal | Stall signal |
|---|---|
| A `Rollout` row started > 14 days ago without `Passed on` | Layer stuck; name the missing exit evidence in the retro |
| An `Enforcement` row `installed` but not `proven` for > 7 days | Gate never seen red; schedule the proof (`deployment-pipeline`) |
| `Approvers` missing a role | Approvals arrive late; name the role holder before the next sign-off |
| An `Events` waiver past its expiry | Expired waiver; remove or renew with a new reason |

The Scrum Master records impediments in its own log (`specs/NNN-slug/impediments.md`); it does not edit the adoption ledger.

## 5. Failure behaviour

- Ledger absent on a repository whose block exists → audit mode creates it from the block, `git log -- AGENTS.md .agentic-sdlc/`, and merged PRs, marking reconstructed rows `(reconstructed)`.
- A block line with no ledger row behind it (`Enforcement: branch-protection` without a `proven` row) → audit finding; the line reverts to `prompt-only` until the proof exists.
- No secrets, tokens or personal data in any row; approvers are named by handle or role.
