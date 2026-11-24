# Threat model: Self-service export of personal account data

<!-- Example (synthetic). Written from skills/agentic-sdlc/templates/threat-model.md; mandatory on the Full path (spec-lint TM01). -->

- **Spec:** `specs/052-account-data-export/spec.md` rev 1
- **Revision:** 1
- **Path and risk:** Full · R=2 (personal data, regulated)
- **Written by:** Security Auditor · fresh-context · 2026-11-24
- **Assets:** export archives (complete personal data of one account); download tokens; audit trail
- **Trust boundaries:** TB-1 browser → accounts API; TB-2 accounts API → export worker; TB-3 export worker → archive storage; TB-4 notify service → email provider
- **Data flows:** DF-1 holder requests an export; DF-2 worker reads 6 data domains and writes the archive; DF-3 email with link sent to the holder; DF-4 holder downloads the archive; DF-5 support console reads export status
- **Out of scope:** compromise of the email account itself (mitigated by the session requirement in AC-4, not by this spec)

## Threats

| ID | Data flow | Threat | STRIDE | L × I | Rating | Mitigation |
|---|---|---|---|---|---|---|
| TH-1 | DF-3, DF-4 | A person who obtains a forwarded email link downloads another holder's archive | I | 2 × 3 = 6 | high | Download needs a session for the same account plus a single-use token · AC-4 |
| TH-2 | DF-1 | An attacker with a stolen session requests an archive of the victim's data | S | 2 × 3 = 6 | high | Password re-entry before queueing · AC-1; one request per 24 h · AC-6; audit event · AC-7 |
| TH-3 | DF-2 | A join error places another account's records in the archive | I | 1 × 3 = 3 | medium | Per-account query scope; archive diff test · AC-3 |
| TH-4 | DF-2, DF-4 | Archives persist past their purpose and leak in a later breach | I | 2 × 3 = 6 | high | 7-day deletion and HTTP 410 · AC-5; encryption at rest (Constraints) |
| TH-5 | DF-5 | A support agent reads archive content through the console | E | 1 × 3 = 3 | medium | Status-only view; direct archive request returns 403 · AC-9 |
| TH-6 | DF-1 | A holder denies having requested an export | R | 1 × 2 = 2 | low | Audit event with actor and timestamp · AC-7 |

## Residual risks

- none

## Revision log

- 1 · 2026-11-24 · first model for spec rev 1
