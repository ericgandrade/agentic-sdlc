# Spec: Session idle timeout restored to 30 minutes

<!--
Example 1 of 3 (synthetic) — a Quick-SIZE bug fix routed to Standard by one risk trigger.
Size alone scores S=3 (Quick), but the defect sits in session handling (auth trigger, R=1), so the
path is Standard and this spec exists. A true Quick change (S ≤ 4 and R=0) has no spec.md: the issue
carries the problem, 1–3 acceptance criteria and the rollback line (lifecycle.md § 3 Paths).
Check: node skills/agentic-sdlc/scripts/spec-lint.mjs skills/spec-driven-development/examples/031-session-idle-timeout/spec.md
-->

| Field | Value |
|---|---|
| ID | 031-session-idle-timeout |
| Revision | 1 |
| Path | Standard |
| Size | S=3 · files 1 + components 1 + iterations 1 |
| Risk | R=1 · auth |
| Owner | Product Owner · M. Duarte |
| Issue | #877 |
| Intake | n/a — no duplicate or prior rejection found (tracker search: "logged out", "session expired", "idle timeout") |

## Problem

Since release 4.12.0 on 2026-11-10, signed-in users are logged out after 5 minutes of inactivity instead of 30 minutes. Support logged 63 tickets in 9 days about lost form input after an unexpected sign-out. The configuration key `session.idleTimeoutSeconds` is read as minutes by the new session middleware, so the stored value 300 is applied as 5 minutes after a unit conversion.

## Users

- **Signed-in customer** — fills multi-step forms that take 10 to 25 minutes.
- **Security officer** — owns the idle-timeout policy (30 minutes, policy SEC-07).
- **SRE on-call (identity team)** — receives the session alert.

## Stories

- As a signed-in customer, I want my session to stay valid for 30 minutes of inactivity, so that I do not lose form input after a 6-minute pause.
- As a security officer, I want sessions idle for more than 30 minutes to end, so that the fix does not extend the policy limit.

## Experience

n/a — no screen, message or copy changes; the existing sign-in page and its "Your session ended" message are reused unchanged.

## Acceptance criteria

| ID | Criterion | Priority |
|---|---|---|
| AC-1 | Given a signed-in user whose last request was 29 minutes ago, when they send a request, then the request succeeds with HTTP 200 and the session idle timer restarts. | critical |
| AC-2 | Given a signed-in user whose last request was 31 minutes ago, when they send a request, then the server returns HTTP 401 and redirects to the sign-in page with reason `idle_timeout`. | critical |
| AC-3 | Given the configuration value `session.idleTimeoutSeconds` = 1800, when the session middleware starts, then it logs the applied timeout as `idle_timeout_s=1800` exactly once. | normal |
| AC-4 | Given a session that has been active for 12 hours, when the user sends a request, then the absolute session limit still ends it with HTTP 401 (this fix leaves the 12-hour absolute limit unchanged). | critical |

## Non-goals

- Changing the 30-minute policy or the 12-hour absolute limit.
- A "stay signed in" option or a warning dialog before expiry.
- Restoring form input lost before the fix.

## Constraints

- **Always:** read the timeout in seconds; cover the unit conversion with a unit test at 299 s, 1,800 s and 1,801 s.
- **Ask first:** any change to the session store schema or cookie attributes.
- **Never:** raise the idle timeout above 1,800 s; log session IDs or tokens.

## Security notes

| Topic | Notes |
|---|---|
| Data classes | Session identifiers (secret-equivalent); no new data is stored |
| Authentication and authorization | Idle and absolute limits enforce policy SEC-07; AC-2 and AC-4 prove the limits still end sessions |
| Inputs | One configuration value, validated as an integer between 60 and 1,800 at startup; out-of-range values stop the service start |
| Secrets | none — the session signing key is unchanged and not read by this change |

## Rollback

1. Command: `deployctl rollback session-service --to 4.12.0 --env prod`
2. Verify: `curl -s https://id.example.test/healthz | jq .idle_timeout_s` prints `300` (the pre-fix behavior) within 120 s.
3. Data: no data migration; sessions created after the fix keep their expiry until the next request.

## Release & observability

| Item | Value |
|---|---|
| Signal | metric `session_expired_total{reason}` · AC-1, AC-2, AC-4; log line `idle_timeout_s` · AC-3 |
| Alert | `session_expired_total{reason="idle_timeout"}` per 1,000 active sessions > 40 over 30 min → `#identity-oncall` |
| Dashboard or query | Grafana › Identity › Session expiry by reason |
| Owner | SRE on-call, identity team · J. Park |
| Rollout | stages 10% → 100% of session-service pods, 2 h watch per stage |
| Rollback command | `deployctl rollback session-service --to 4.12.0 --env prod` |

## Indicator

| Indicator | Baseline | Target | Method | First reading |
|---|---|---|---|---|
| Support tickets tagged `unexpected-logout` | 7 tickets/day (2026-11-10 to 2026-11-18) | ≤ 1 ticket/day | Help-desk tag count, daily | Release + 3 days |

## Open questions

None.

## Revision log

| Rev | Date | Change | Requested by | Critique |
|---|---|---|---|---|
| 1 | 2026-11-19 | First draft from issue #877 and the incident timeline | Product Owner | fresh-context · 12/12 · 2 fixed (absolute-limit regression AC-4, startup validation range), 0 open |

## Approvals

| Sign-off | Rev | Hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|

### Waivers

| ID | Kind | Gate waived | Severity | Reason | Requester | Owner | Granted | Expires | Follow-up |
|---|---|---|---|---|---|---|---|---|---|
