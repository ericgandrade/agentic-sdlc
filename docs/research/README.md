# Research index and status

**Last updated:** 2026-11-22 (S-A card for the Agentic SDLC added) · **Branch:** `claude/superskills-dev-workflow-kppj2r`

This folder holds the evidence behind the Agentic SDLC method. Read this page first: it says what each file is, how far each piece got, how reliable it is, and what is still open. The execution plan is `docs/plans/2026-11-20-agentic-sdlc-execution-plan.md`.

> 🛑 **Build gate.** The large build effort (Phase 0 onward of the execution plan) must not start until the scoring round (§4) has produced a verdict and the owner has reviewed it.

---

## 1. Status at a glance

| Block | Files | Status | Reliability notes |
|---|---|---|---|
| Framework mechanism inventories | `inventory/*.md` | ✅ Done | Spot-checked (counts, source paths); Agile V checked for copied text (none) |
| Methods research (structure) | `methods/*.md` | ✅ Done | Several sources were blocked by the network allowlist; some claims come from search excerpts (marked) |
| Structure decision (D10) | `methods/2026-11-20-structure-proposal.md` | ✅ Approved 2026-11-20 | Decision D10 in the execution plan |
| Scoring methodology | `scoring/methodology.md`, `evaluator-agent.md` | ✅ Frozen 2026-11-20 | Hashes in `scoring/FREEZE.md`; written blind to our proposal |
| Scoring of 9 benchmark methods | `scoring/scores/S-*/` | ✅ Done (18 cards, 2 independent cards per method) | See §4 for open points the auditor must check |
| Scoring of the Agentic SDLC (design-only) | `scoring/scores/S-A/` and `S-C/` `agentic-sdlc.md` | ✅ Done (S-A, S-C) | Design score × realization factor |
| Red-team audit | `scoring/audit-log.md`, `scoring/audit/adjustments.json` | ✅ Done (AUD-1: 81 challenges, 10 upheld, 4 to adjudicator) | Upheld changes applied by `aggregate.py` |
| Aggregation and verdict | `scoring/results.md` (generated) | ✅ **Round 2 verdict: Superior** (RA 88.5 vs AWS AI-DLC 68.6; S1–S7 hold) | Round 1 was Not superior (RA 53.2, archived in `scoring/round1-agentic-sdlc/`); round 2 audited by AUD-2 (`scoring/audit-log-round2.md`), robust to the open C3 adjudication item |
| Earlier framework evaluation | `2026-11-18-dev-workflow-frameworks-evaluation.md` | 🕰 Historical | Written for the V-shaped design; the framework comparison and absorption map remain useful |

---

## 2. Framework inventories (`inventory/`)

Deep catalogs of concrete mechanisms (prompts, checklists, rubrics, scripts, formats). Each ends with a ranked top 15 (top 10 for Agile V).

| File | Framework (license) | Pin | Mechanisms | Words |
|---|---|---|---|---|
| `superpowers.md` | Superpowers (MIT) | `22f0b46` | 73 (SP-01…73) | ~20k |
| `mattpocock.md` | Matt Pocock skills (MIT) | `5863806` | 83 (MP-01…83) | ~18k |
| `addyosmani.md` | Addy Osmani agent-skills (MIT) | `39b723c` | 120 (AO-01…120) | ~26k |
| `bmad.md` | BMad Method v7 preview (MIT) | `e435a22` | 91 (BM-01…91) | ~23k |
| `agile-v-concepts.md` | Agile V (CC BY-SA 4.0, **concepts only, own words**) | `4bcc917` | 40 (AV-01…40) | ~4k |

Caveats: "Target/adaptation" lines were written for the earlier V-shaped design and are superseded by D10 (a naming note at the top of each file says so). Agile V text must never be copied into the repository.

---

## 3. Methods research (`methods/`)

| File | Content | Sources |
|---|---|---|
| `classic-and-standards.md` | ISO/IEC/IEEE 12207, SWEBOK v4, Waterfall, V-model, Spiral, RUP, IEC 62304, DO-178C | 41 refs; † marks claims not re-read in the primary text (46 marks) |
| `agile-flow-devops.md` | Scrum, Kanban, XP, SAFe, Disciplined Agile, Shape Up, CD, DORA, trunk-based, etc. | 107 links; 11 claims marked "unverified against fetched text" (scrumguides.org and kanbanguides.org were blocked) |
| `ai-native-methods.md` | Spec Kit, Kiro, AWS AI-DLC, BMad, OpenSpec, Agent OS, Anthropic playbook, Thoughtworks, etc. | 51 sources; [R] = read directly (Spec Kit, AI-DLC, OpenSpec, Agent OS, Anthropic playbook), [S] = search summary only (several vendor sites blocked) |
| `bmad-and-mattpocock-structure.md` | How the two frameworks the owner draws inspiration from structure delivery | Derived from the inventories |
| `2026-11-20-structure-proposal.md` | Synthesis → **decision D10** (seven standard stages, four approvals, eight agents named by function, three paths, standard artifacts) | Cites the four files above |

Key findings that shaped D10: standard SDLC words with no stage codes; feature flow specify → plan → tasks → implement → verify; four recurring human approvals (spec, plan, PR, release); per-stage persona agents are in retreat (planner, implementer, independent reviewer survive); rigor scaled by risk (IEC 62304 A/B/C, DO-178C); gaps across all AI-native methods (operations, measured outcomes, security by default, traceability past the PR, enforced approvals, brownfield, mid-flight change).

**Before quoting to customers or auditors:** verify the † and unverified claims against primary sources. The standards mapping appendices planned for the final guide must be written from the public documents (e.g., NIST SP 800-218), not from these excerpts.

---

## 4. Scoring round 1 (`scoring/`)

**Goal:** prove, before building, that the Agentic SDLC is superior to the benchmark methods under pre-registered criteria.

**Method (frozen):** 16 criteria (C1–C16) with 0–5 anchored scales, baseline weights summing to 100 plus four alternative profiles, evidence rules and confidence, design-only scoring (design score × realization factor, concreteness test), and a seven-condition superiority test (S1–S7). Hashes: `FREEZE.md`. Calculation script: `aggregate.py` (committed before any score).

**Cards (two independent scorers per method):**

| Method | Scorers | Notes |
|---|---|---|
| Superpowers, Matt Pocock, Addy Osmani, BMad, Spec Kit, AI-DLC, OpenSpec | 2 cards each ✅ | Evidence: pinned clones read directly |
| AWS Kiro | S-B (re-scored from official docs) + S-D ✅ | Closed product: documentation-only evidence capped at 4. S-B's first card (commit `8b8aebf`, Low confidence, repo README + snippets only) was superseded after `kiro.dev` was allowed in the environment |
| Agile V | S-B + S-D ✅ | Cards cite paths/identifiers only; checked for copied text |
| **Agentic SDLC (design-only)** | S-A ✅, S-C ⏳ | Scored after each scorer finished its benchmarks |

**Open points the red-team auditor must review** (also in `scoring/orchestrator-log.md`):
1. Spec Kit C5 was revised 1 → 2 by its scorer for consistency with OpenSpec — check C5 consistency across all methods.
2. Kiro: compare the S-B and S-D cards (S-B changed seven cells after reading the official docs).
3. Contestable readings flagged by scorers: OpenSpec C15 (CLI dependency), BMad C15 (uv/Python), Agile V C2 (no explicit non-goals), C4 (unwired reference module), C8 (human-gated by design), C12 (release skill outside the default profile).
4. Both Agentic SDLC cards (design-only rules, realization factors). S-A applied strict calls (hedged enforcement and "minimum additions" lines not credited; evals without pass thresholds not counted) — check that benchmarks were judged with the same strictness.

**Next steps (see `scoring/HANDOFF.md`):** finish the two Agentic SDLC cards → red-team audit → `python3 docs/research/scoring/aggregate.py` (also run once without the Kiro cards to test robustness) → present the verdict and gap table to the owner. If the verdict is not "Superior", change the plan before building.

---

## 5. Evidence limits (read before relying on any number)

- **Network allowlist:** during the research, `scrumguides.org`, `kanbanguides.org`, `en.wikipedia.org`, `webstore.iec.ch`, `aws.amazon.com`, `martinfowler.com`, `thoughtworks.com`, `sonarsource.com`, `arxiv.org`, `docs.factory.ai` and `github.blog` were unreachable; `kiro.dev` was added later. Claims from blocked hosts rest on search excerpts and are marked.
- **Scorers are AI agents**, not human experts. Independence is procedural (separate scorers, frozen methodology, no cross-reading, red-team audit); it does not remove model bias. The design-only method gets a realization discount, but its owner is also the orchestrator of the round — the audit and the published methodology exist to expose any favoritism.
- **Closed product (Kiro):** never scored from hands-on use.
- **Benchmarks are snapshots** (November 2026); BMad v7 is a preview alpha and changes often.

---

## 6. Where to continue

1. Read `scoring/HANDOFF.md` and `scoring/orchestrator-log.md`.
2. If both `scores/S-A/agentic-sdlc.md` and `scores/S-C/agentic-sdlc.md` exist, run the audit and the aggregation; otherwise finish the missing card first (do not run it in parallel with another session).
3. Review the verdict with the owner. Only then lift the build gate and follow the execution plan from Phase 0.
