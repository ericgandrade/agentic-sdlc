# UX: CSV export of filtered report rows

<!-- Worked example (synthetic). Written from templates/ux.md by the UX Designer during Specify. -->

| Field | Value |
|---|---|
| Spec | `specs/001-csv-export/spec.md` rev 1 |
| Revision | 1 |
| Surfaces | Reports page: the Export CSV button, the limit message, the downloaded file name |
| Design system | Internal UI kit v4 (`Button`, `InlineAlert`, `Toast`) |
| Accessibility target | WCAG 2.2 AA |

## Journeys

| ID | Story | Entry | Steps | Success | Failure exits |
|---|---|---|---|---|---|
| J-1 | Finance analyst exports the current filter | Reports page with a filter applied | 1. Click **Export CSV** 2. Browser saves `orders-YYYY-MM-DD.csv` | File downloaded; toast "Exported N rows" | Over 50,000 rows → UX-4 · server error → UX-5 |
| J-2 | Report viewer without the export permission | Reports page | — | No export control is shown | Direct URL → HTTP 403 (AC-3) |

## State table

| ID | Surface | State | Trigger | What the user sees (copy) | Action available | AC |
|---|---|---|---|---|---|---|
| UX-1 | Export CSV button | empty | Filter matches 0 rows | Button disabled; tooltip "No rows to export" | none | pattern: `Button` disabled state |
| UX-2 | Export CSV button | loading | Export takes > 300 ms | Label "Exporting…", button disabled, `aria-live` announcement | none | pattern: `Button` busy state |
| UX-3 | Download + toast | success | File written | Toast "Exported N rows" | Open file (browser) | AC-1 |
| UX-4 | Limit message | partial or limit | Filter matches > 50,000 rows | Inline alert "Export limit is 50,000 rows; narrow the filter" | Edit the filter | AC-4 |
| UX-5 | Toast | error | Export endpoint returns 5xx | "Export failed. Try again; if it keeps failing, contact support." | Retry | pattern: `Toast` error |
| UX-6 | Export CSV button | no permission | User lacks `reports:export` | Button not rendered | none | AC-3 |

## Accessibility

| ID | Requirement | Check |
|---|---|---|
| A-1 | Export CSV reachable by Tab from the filter bar; visible focus ring | Keyboard walkthrough |
| A-2 | Button has the accessible name "Export CSV"; the busy state and the result toast are announced | axe scan + VoiceOver pass |
| A-3 | Limit alert text contrast ≥ 4.5:1 | axe scan |
| A-4 | Limit alert uses an icon and text, not color alone | Review |

## Wireframe

```text
┌ Reports ───────────────────────────────────────────────┐
│ [Date ▾] [Status ▾] [Search…]            [Export CSV] │
│ ⚠ Export limit is 50,000 rows; narrow the filter       │  ← UX-4 only
│ Order ID   Order date   Total                          │
└────────────────────────────────────────────────────────┘
```

## Open questions

None.

## Test-stage checks

| ID | Evidence (screenshot, rendered output, scanner run) | Result |
|---|---|---|
| UX-1 | Screenshot UX-1 in PR #138 (head `1b8d74a`) | pass |
| UX-2 | Screenshot UX-2 in PR #138 | pass |
| UX-5 | Screenshot UX-5 in PR #138 (endpoint stubbed to 500) | pass |
| A-1..A-4 | axe: 0 violations on the reports page; keyboard and VoiceOver notes in PR #138 | pass |
