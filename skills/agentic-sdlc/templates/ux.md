# UX: {{title}}

<!--
Template for specs/NNN-slug/ux.md.
- Written by the UX Designer (agents/ux-designer.md) in Specify, when the change touches a user-facing surface:
  a screen, page, component, CLI output or flags, a user-visible message (error, empty state, email,
  notification), or the developer experience of a public API.
- Linked from spec.md §Experience and listed as evidence in the Specify sign-off request.
- The Test Engineer maps every state row to a test ID or to a UX-n check; the UX Designer checks those at Test.
- A cell with nothing to report says "n/a — <reason>"; never leave it blank. Keep every heading.
-->

| Field | Value |
|---|---|
| Spec | `specs/{{NNN-slug}}/spec.md` rev {{N}} |
| Revision | 1 |
| Surfaces | {{page, component, CLI command, message}} |
| Design system | {{component library + version}} or {{none — reason}} |
| Accessibility target | WCAG 2.2 AA |

## Journeys

<!-- One journey per story: entry point → steps → success state, then each failure exit. -->

| ID | Story | Entry | Steps | Success | Failure exits |
|---|---|---|---|---|---|
| J-1 | {{story}} | {{where the user starts}} | {{1. … 2. …}} | {{what the user sees}} | {{error → state UX-n}} |

## State table

<!--
Every surface × every state.
- Each row names the AC that covers it; or `pattern: <component>` when an existing design-system component already
  gives that behavior; or "proposed" when a new AC is sent to the Analyst.
- States: empty · loading · success · partial or limit · error · no permission. Add any other state the surface has.
-->

| ID | Surface | State | Trigger | What the user sees (copy) | Action available | AC |
|---|---|---|---|---|---|---|
| UX-1 | {{surface}} | empty | {{no data}} | "{{copy}}" | {{action}} | {{AC-n or proposed}} |
| UX-2 | {{surface}} | loading | {{request in flight > 300 ms}} | {{spinner + label}} | {{cancel or none}} | {{AC-n}} |
| UX-3 | {{surface}} | success | {{event}} | "{{copy}}" | {{action}} | {{AC-n}} |
| UX-4 | {{surface}} | partial or limit | {{limit reached}} | "{{copy}}" | {{action}} | {{AC-n}} |
| UX-5 | {{surface}} | error | {{failure}} | "{{copy: what happened + what to do}}" | {{retry}} | {{AC-n}} |
| UX-6 | {{surface}} | no permission | {{missing permission}} | {{hidden, or disabled + reason}} | {{none}} | {{AC-n}} |

## Accessibility

| ID | Requirement | Check |
|---|---|---|
| A-1 | Every action is reachable by keyboard; focus is visible; focus order is logical | {{keyboard walkthrough}} |
| A-2 | Every control has an accessible name; status changes are announced (`aria-live`) | {{scanner + screen reader}} |
| A-3 | Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI components) | {{scanner}} |
| A-4 | No information is conveyed by color alone; motion respects the reduced-motion setting | {{review}} |

## Wireframe

```text
{{ASCII sketch, or a link to the design file}}
```

## Open questions

None.

## Test-stage checks

<!-- Filled by the UX Designer at Test against the PR head: one row per UX-n and A-n not covered by an automated test. -->

| ID | Evidence (screenshot, rendered output, scanner run) | Result |
|---|---|---|
| {{UX-n or A-n}} | {{path or link}} | {{pass, or fail → finding}} |
