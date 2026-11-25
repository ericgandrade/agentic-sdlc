# Agentic SDLC — adoption ledger

<!-- Template for .agentic-sdlc/adoption.md (project-context; rules in ../references/adoption-ledger.md).
     Append rows; correct a row only with a later row that cites it. No secrets or personal data. -->

Repository: <owner/name> · Started: <YYYY-MM-DD> · agentic-sdlc <version>

## Approvers

| Role | Name or handle | Since | Recorded by |
|---|---|---|---|
| Product Owner | <handle> | <YYYY-MM-DD> | <handle> |
| Tech Lead | <handle> | <YYYY-MM-DD> | <handle> |
| Reviewer | <handle> | <YYYY-MM-DD> | <handle> |
| Release Owner | <handle> | <YYYY-MM-DD> | <handle> |

## Rollout

| Week | Scope | Started | Exit check | Evidence | Passed on | Confirmed by |
|---|---|---|---|---|---|---|
| 1 — Quick | Bug fixes and small changes on the Quick path | <date> | ≥ 3 merged Quick PRs with fresh Verification; one batched retro | <PR links · retro file> | <date or open> | <handle> |
| 2 — Standard | One feature on the Standard path | <date> | Item reaches Operate with every approval; `spec-lint --check-approval` and `plan-graph --check --check-approval` pass | <spec folder · output> | <date or open> | <handle> |
| 3 — CI gates | CI template, CODEOWNERS, branch protection; each gate proven | <date> | Every control in the Enforcement table `proven` | <run links> | <date or open> | <handle> |

## Existing artifacts

| Tool | Files found | Mapped to | Added to the existing files | Authoritative? | Decided by |
|---|---|---|---|---|---|
| <Spec Kit · Kiro · OpenSpec · AI-DLC · BMad · ADR folder · none> | <paths> | <mapping> | <`## Approvals`, `AC-n`, …> | <yes · read-only> | <handle> |

## Instruction ledger summary

| Date | Files audited | Retained | Rewritten | Relocated | Automated | Deleted | Approved by | Deleted lines (ground) |
|---|---|---|---|---|---|---|---|---|
| <date> | <AGENTS.md, CLAUDE.md> | n | n | n | n | n | <handle> | <"quoted line" — G1 stale: evidence> |

## Enforcement

| Control | State (absent · installed · proven) | Proof (red run · green run) | Date | Owner |
|---|---|---|---|---|
| Check `agentic-sdlc/dod` required | <state> | <links> | <date> | <handle> |
| Check `agentic-sdlc/spec` required | <state> | <links> | <date> | <handle> |
| Check `agentic-sdlc/approvals` required | <state> | <links> | <date> | <handle> |
| Branch protection (≥ 1 review, stale reviews dismissed) | <state> | <links> | <date> | <handle> |
| CODEOWNERS enforced | <state> | <links> | <date> | <handle> |
| `production` environment reviewers | <state> | <links> | <date> | <handle> |
| Floor guard (CONSTRAINTS.md) | <state> | <links> | <date> | <handle> |

## Baseline

| Date | SHA | Tests pass/total | Coverage % | Red test IDs | `baseline-red` issues |
|---|---|---|---|---|---|
| <date> | <sha12> | <n>/<n> | <n> | <ids or none> | <links or none> |

## Retroactive ADR candidates

| Decision | Evidence (hard to reverse · surprising · trade-off) | Owner | ADR |
|---|---|---|---|
| <decision> | <file:line · why each condition holds> | Architect | <NNNN or pending> |

## Events

| Date | Event | Detail | By |
|---|---|---|---|
| <date> | <vendor · upgrade · probe change · waiver · layer rollback> | <detail> | <handle> |
