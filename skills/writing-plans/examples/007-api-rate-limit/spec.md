# Spec: Per-key rate limit on the public API

<!-- Example (synthetic) for the writing-plans skill. EXCERPT: only the sections the plan reads
(header, acceptance criteria, constraints, rollback, revision log, approvals). A real spec is written
from ../../../agentic-sdlc/templates/spec.md and passes spec-lint in full. -->

| Field | Value |
|---|---|
| ID | 007-api-rate-limit |
| Revision | 1 |
| Path | Standard |
| Size | S=4 · files 2 + components 1 + iterations 1 |
| Risk | R=1 · public API |
| Owner | Product Owner · A. Mensah |
| Issue | #588 |
| Intake | n/a — no duplicate or prior rejection found (tracker search: "rate limit", "429", "throttle") |

## Acceptance criteria

| ID | Criterion | Priority |
|---|---|---|
| AC-1 | Given an API key that has made 100 requests in the current 60-second window, when it sends one more request, then the API returns HTTP 429 with body `{"error":"rate_limited"}` and a `Retry-After` header holding the whole seconds until the window resets (1–60). | critical |
| AC-2 | Given a request within the limit, when the API responds, then the response carries `X-RateLimit-Limit: 100` and `X-RateLimit-Remaining: <n>`, where n is 100 minus the requests used in the window. | normal |
| AC-3 | Given a key ID listed in the configuration `rateLimit.exemptKeyIds`, when it sends any number of requests, then none is refused and no rate-limit header is added. | normal |
| AC-4 | Given the counter store is unreachable, when a request arrives, then the request is served without rate-limit headers (fail open) and the metric `rate_limit_store_errors_total` increases by 1. | critical |
| AC-5 | Given the public API reference, when a developer reads the rate-limit page, then it states the limit, both headers and the 429 response with one example. | normal |

## Constraints

- Counter store: the existing Redis cluster (client `ioredis`, already in the lockfile for sessions). No new package.
- Added latency at p95 ≤ 5 ms per request (measured in staging before 100% rollout).

## Rollback

Set `rateLimit.enabled=false` (flag, default off); no data migration to undo.

## Revision log

| Rev | Date | Change | Requested by | Critique |
|---|---|---|---|---|
| 1 | 2026-11-23 | First draft from issue #588 | Product Owner | fresh-context · 12/12 · 2 fixed (Retry-After range, exempt keys get no headers), 0 open |

## Approvals

| Sign-off | Rev | Hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|
| Specify | 1 | cfd4bf1b73a7 | 2026-11-23 16:20 | Product Owner | A. Mensah | "Yes, approved — spec rev 1." | spec-lint exit 0; critique 12/12 | p95 latency unmeasured until staging | approved |
