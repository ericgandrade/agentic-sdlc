# UX: Self-service export of personal account data

<!-- Example (synthetic). Written from skills/agentic-sdlc/templates/ux.md. -->

| Field | Value |
|---|---|
| Spec | `specs/052-account-data-export/spec.md` rev 1 |
| Revision | 1 |
| Surfaces | Privacy settings › "Download your data" panel; "Archive ready" email; download page; support-console status line |
| Design system | Acme UI 7.2 (Panel, Button, InlineAlert, PasswordDialog) |
| Accessibility target | WCAG 2.2 AA |

## Journeys

| ID | Story | Entry | Steps | Success | Failure exits |
|---|---|---|---|---|---|
| J-1 | Request an archive | Settings › Privacy | 1. Select "Request archive". 2. Re-enter password. 3. Confirm | Panel shows the preparing message (UX-2) | wrong password → pattern: PasswordDialog error; second request within 24 h → UX-4 |
| J-2 | Download the archive | "Archive ready" email | 1. Open link. 2. Sign in if needed. 3. Download | ZIP download starts (UX-3) | other account → UX-6; expired → UX-5 |
| J-3 | Support checks status | Support console › Account | 1. Open the account | Status and dates shown (UX-8) | none |

## State table

| ID | Surface | State | Trigger | What the user sees (copy) | Action available | AC |
|---|---|---|---|---|---|---|
| UX-1 | Panel | empty | No export yet | "Get a copy of your personal data as a ZIP file. It can take up to 24 hours." | Request archive | AC-1 |
| UX-2 | Panel | loading | Job queued or running | "Preparing your archive — we will email you when it is ready" | none | AC-1, AC-2 |
| UX-3 | Download page | success | Archive ready, same account | "Your archive is ready. Available until <date>." | Download ZIP | AC-4 |
| UX-4 | Panel | partial or limit | Request within 24 h of the last | "You can request a new archive after <time, local zone>." | none | AC-6 |
| UX-5 | Download page | error | Link older than 7 days | "This link has expired. Request a new archive from Privacy settings." | Link to settings | AC-5 |
| UX-6 | Download page | no permission | Signed in as another account | Generic "Page not found" (no hint that an archive exists) | Link to home | AC-4 |
| UX-7 | Email | error | Job failed 3 times | "We are preparing your archive by hand; you will hear from us within 7 days" | Reply to support | AC-8 |
| UX-8 | Support console | success | Export exists | "Data export: ready · requested <date> · expires <date>" — no link | none | AC-9 |

## Accessibility

| ID | Requirement | Check |
|---|---|---|
| A-1 | Every action is reachable by keyboard; focus is visible; focus order is logical | Keyboard walkthrough of J-1 and J-2 (AC-10) |
| A-2 | Every control has an accessible name; status changes are announced (`aria-live`) | Screen reader pass on UX-2 → UX-3 (AC-10) |
| A-3 | Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI components) | Scanner |
| A-4 | No information is conveyed by color alone; motion respects the reduced-motion setting | Review of the status badge |

## Wireframe

```text
Privacy settings
┌ Download your data ─────────────────────────────┐
│ Get a copy of your personal data as a ZIP file. │
│ It can take up to 24 hours.   [Request archive] │
└─────────────────────────────────────────────────┘
```

## Open questions

None.

## Test-stage checks

| ID | Evidence (screenshot, rendered output, scanner run) | Result |
|---|---|---|
| n/a — filled at Test | n/a | n/a |
