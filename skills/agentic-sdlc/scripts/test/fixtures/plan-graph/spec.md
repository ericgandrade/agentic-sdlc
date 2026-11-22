# Spec: fixture for plan-graph tests

| Field | Value |
|---|---|
| ID | 900-fixture |
| Revision | 2 |
| Path | Standard |

## Acceptance criteria

<!-- AC-9 in this comment is ignored by the parser. -->

| ID | Criterion | Priority |
|---|---|---|
| AC-1 | Given a list, when it is exported, then every row appears once. | normal |
| AC-2 | Given an empty list, when it is exported, then only the header is written. | normal |
| AC-3 | Given a user without permission, when they export, then the server returns 403. | critical |
| AC-4 | Retired in rev 2: merged into AC-1. | normal |
