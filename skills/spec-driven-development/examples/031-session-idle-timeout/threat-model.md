# Threat model: Session idle timeout restored to 30 minutes

<!-- Example (synthetic). Written from skills/agentic-sdlc/templates/threat-model.md for a Standard spec with the auth trigger. -->

- **Spec:** `specs/031-session-idle-timeout/spec.md` rev 1
- **Revision:** 1
- **Path and risk:** Standard · R=1 (auth)
- **Written by:** Security Auditor · fresh-context · 2026-11-19
- **Assets:** active sessions (account takeover on shared devices); idle-timeout policy SEC-07
- **Trust boundaries:** TB-1 browser → session-service; TB-2 operator → configuration store
- **Data flows:** DF-1 browser sends the session cookie to session-service on every request; DF-2 operator sets `session.idleTimeoutSeconds` in the configuration store
- **Out of scope:** cookie theft over the network (TLS and cookie flags owned by the platform spec 004-cookie-hardening)

## Threats

| ID | Data flow | Threat | STRIDE | L × I | Rating | Mitigation |
|---|---|---|---|---|---|---|
| TH-1 | DF-1 | A person at a shared device reuses a session left idle for over 30 minutes | E | 2 × 3 = 6 | high | Idle limit enforced server-side · AC-2 |
| TH-2 | DF-1 | A stolen session stays usable beyond the 12-hour absolute limit after the fix | E | 1 × 3 = 3 | medium | Absolute limit unchanged · AC-4 |
| TH-3 | DF-2 | An operator sets a timeout above policy and sessions outlive SEC-07 | T | 1 × 3 = 3 | medium | Startup range check 60–1,800 s and logged value · AC-3 |

## Residual risks

- none

## Revision log

- 1 · 2026-11-19 · first model for spec rev 1
