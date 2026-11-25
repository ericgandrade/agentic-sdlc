# Agentic SDLC — adoption ledger

Repository: local/strkit (no remote) · Started: 2026-11-24 · agentic-sdlc 2.1.0

## Approvers

| Role | Name or handle | Since | Recorded by |
|---|---|---|---|
| Product Owner | dogfood-owner (SIMULATED) | 2026-11-24 | project-context (agent) |
| Tech Lead | dogfood-owner (SIMULATED) | 2026-11-24 | project-context (agent) |
| Reviewer | dogfood-owner (SIMULATED) | 2026-11-24 | project-context (agent) |
| Release Owner | dogfood-owner (SIMULATED) | 2026-11-24 | project-context (agent) |

## Rollout

| Week | Scope | Started | Exit check | Evidence | Passed on | Confirmed by |
|---|---|---|---|---|---|---|
| 1 — Quick | Bug fixes and small changes on the Quick path | 2026-11-24 | ≥ 3 merged Quick PRs with fresh Verification; one batched retro | dogfood: 1 Quick item only | open | dogfood-owner |
| 2 — Standard | One feature on the Standard path | 2026-11-24 | Item reaches Operate with every approval; `spec-lint --check-approval` and `plan-graph --check --check-approval` pass | specs/001-price-format | open | dogfood-owner |
| 3 — CI gates | CI template, CODEOWNERS, branch protection; each gate proven | — | Every control in the Enforcement table `proven` | n/a — no remote host; CI templates absent | open | — |

## Existing artifacts

| Tool | Files found | Mapped to | Added to the existing files | Authoritative? | Decided by |
|---|---|---|---|---|---|
| none | — | default layout | — | — | project-context |

## Instruction ledger summary

| Date | Files audited | Retained | Rewritten | Relocated | Automated | Deleted | Approved by | Deleted lines (ground) |
|---|---|---|---|---|---|---|---|---|
| 2026-11-24 | none (no instruction files existed) | 0 | 0 | 0 | 0 | 0 | dogfood-owner (SIMULATED) | none |

## Enforcement

| Control | State (absent · installed · proven) | Proof (red run · green run) | Date | Owner |
|---|---|---|---|---|
| Check `agentic-sdlc/dod` required | absent | n/a — no CI | 2026-11-24 | dogfood-owner |
| Check `agentic-sdlc/spec` required | absent | n/a — no CI | 2026-11-24 | dogfood-owner |
| Check `agentic-sdlc/approvals` required | absent | n/a — no CI | 2026-11-24 | dogfood-owner |
| Branch protection (≥ 1 review, stale reviews dismissed) | absent | n/a — no remote | 2026-11-24 | dogfood-owner |
| CODEOWNERS enforced | absent | n/a — no remote | 2026-11-24 | dogfood-owner |
| `production` environment reviewers | absent | n/a — no remote | 2026-11-24 | dogfood-owner |
| Floor guard (CONSTRAINTS.md) | absent | n/a — not Full path | 2026-11-24 | dogfood-owner |

## Baseline

| Date | SHA | Tests pass/total | Coverage % | Red test IDs | `baseline-red` issues |
|---|---|---|---|---|---|
| 2026-11-24 | d0c78b1a9189 | 3/3 | 100.0 | none | none |

## Retroactive ADR candidates

| Decision | Evidence (hard to reverse · surprising · trade-off) | Owner | ADR |
|---|---|---|---|
| none | — | Architect | — |

## Events

| Date | Event | Detail | By |
|---|---|---|---|
| 2026-11-24 | vendor | agentic-sdlc 2.1.0 vendored into .agentic-sdlc/bin (8 files, SHA256SUMS OK) | project-context (agent) |
| 2026-11-24 | setup approval | Step 9 block + code map + ledger shown; exact words: "yes, write it" — SIMULATED by dogfood-owner | dogfood-owner (SIMULATED) |
