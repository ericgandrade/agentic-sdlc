# Fixture plan

**Path:** Standard · **Spec:** `spec.md` rev 2

## Tasks

| ID | Title | AC | Blocked by | Files | Size |
|---|---|---|---|---|---|
| T1 | Export rows | AC-1, AC-2 | — | `src/export.ts`, `test/export.test.ts` | 3h |
| T2 | Check the permission | AC-3 | T1 | `src/auth.ts`, `test/auth.test.ts` | 2h |
| T3 | Log exports | AC-1 | T1 | `src/log.ts`, `test/export.test.ts` | 90m |

## Revision log

| Rev | Date | Change | Reason |
|---|---|---|---|
| 1 | 2026-11-20 | First plan | — |

## Approvals

| Approval | Plan rev | Plan hash | Spec rev | Spec hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|
