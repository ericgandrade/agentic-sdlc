# Classification: bug, task, story, epic

Load this file at Step 4 of the workflow, whenever two classes seem to fit, and when an incident action or retro action arrives. Discover classifies every item as exactly one of four classes (`../../agentic-sdlc/references/lifecycle.md` §1). A spike is not a fifth class: it is a `task` carrying the marker `spike`.

The class describes **what kind of change** the item is. The **path** comes only from the score (`../../agentic-sdlc/references/paths.md` §2). The class never sets or lowers the path: a one-line bug that touches authentication is Standard, and a story that changes one label is Quick.

## 1. Decision procedure (apply in order, first match wins)

| # | Question | Yes → | Evidence to write in the intake record |
|---|---|---|---|
| 1 | Does the request bundle **≥ 2 user-facing goals that can each ship, be tested and be merged as their own PR**, or does it need **≥ 3 merged PRs** before it is complete in production? | `epic` | The goals listed one per line, or the iteration estimate |
| 2 | Does a **written or previously shipped expectation** exist that the system now violates (an `AC-n` in a spec, documentation, release notes, a previous release's behaviour, an error or crash)? | `bug` | The expectation and where it is written; observed vs expected |
| 3 | Will **any user, operator or API consumer notice** a new or changed behaviour (screen, message, CLI output, response field, email, report, default value)? | `story` | One sentence: who notices what |
| 4 | Otherwise (refactor, dependency bump, configuration, CI, tooling, internal documentation, a test-only change, a research question) | `task` (add `spike` when the output is a finding or decision, not merged production code) | What changes and why no user notices |

Counting rule for question 1 (adapted from a single-goal scope standard): never count verbs, "and" conjunctions or noun phrases. "Add validation and show the errors" is one goal. "Dark mode toggle, JWT refactor and admin dashboard" is three goals: each is reviewable, testable and mergeable alone.

## 2. Tie-breakers

| Conflict | Ruling | Why |
|---|---|---|
| Reported as a bug, but no written or shipped expectation exists | `story` | A missing feature reported as a defect skips the Product Manager and the product decision. Tell the reporter in one line: "Classified as a story: no spec, doc or past release promised this behaviour." |
| Bug whose fix changes a public contract (response shape, CLI flag) | `bug`; the `public API` trigger raises R | Class follows the cause; risk follows the diff |
| Refactor that changes a user-visible message or timing | `story` | Question 3 decides: users notice |
| Story small enough for one PR and ≤ 3 files | `story`; the score may still give Quick | Class and path are independent |
| Task with a risk trigger (dependency upgrade of the auth library) | `task`; R = 1 → Standard | Risk route overrides size |
| Epic in disguise: "small" request whose acceptance needs a migration, a backfill and a UI change shipped in order | `epic` when ≥ 3 merged PRs are needed | Iterations ≥ 3 scores 3 size points anyway |
| Performance regression against a stated threshold (spec Release & observability, SLO) | `bug` | The threshold is the written expectation |
| Performance improvement with no stated threshold | `story` (users notice) or `task` (only internal) | No expectation is violated |
| Security vulnerability report | `bug` with the relevant triggers (often `auth`, sometimes `personal/health data` → Full); never discussed in public tracker comments beyond the minimum | The fix restores an expected protection |

## 3. Class-specific intake duties

| Class | Duty before the item is ready | Next stage handling |
|---|---|---|
| `bug` | **Verify the claim:** record the reporter's steps, observed vs expected, version and environment; name the code path that would produce it (read-only). Status `reproduced` (a human or CI ran it), `plausible: <code path>`, `not reproduced` or `insufficient detail`. `insufficient detail` → needs-info. | Build starts with a failing regression test that reproduces it (`test-driven-development`); root-cause work goes to `systematic-debugging` |
| `task` | State why no user notices; name the files or components | Quick when the score allows; `spike` tasks carry a timebox (≤ 2 days) and a question that can be stated precisely now |
| `story` | One user, one outcome, one indicator (from the PM brief when triggered) | Specify on Standard/Full; on Quick the Analyst writes `AC-1` in the issue |
| `epic` | Propose the split (§4); never score the epic as one path | One child item per module or goal, each with its own intake record and score |

## 4. Splitting an epic

1. List the goals or capabilities. When they have their own users or data and ship and verify separately (identity, billing, notifications), use the **capability map** of `spec-driven-development` Step 1 (`../../spec-driven-development/SKILL.md`): `| Module | Responsibility | Depends on |` plus a build order, module IDs in kebab-case, dependencies pointing one way.
2. When the goals are slices of one capability, slice by outcome: the first child is the thinnest end-to-end path through every layer the epic touches; the next is the slice the Product Owner is least sure of. Never split by layer ("backend story", "frontend story"): a layer cannot ship alone.
3. Split, never shrink: words such as "for now", "placeholder", "simplified" or "wired later" in a child mean a second child item exists.
4. Open one child item per module or slice, each linking the parent epic. The epic issue keeps the map, the build order and one line per child; it holds no acceptance criteria.
5. Score every child separately with the paths rubric. The epic itself carries no path line; write `Path: n/a — epic, split into #n, #n, #n`.
6. Present the map to the Product Owner as part of the intake decision when the split changes scope; otherwise show it and continue.

## 5. Inputs from Operate and retrospectives

| Input | Typical class | Rule |
|---|---|---|
| Postmortem action ("add a timeout alarm on the export worker") | `task` | Copy the postmortem path and its action owner; due date from the postmortem |
| Alert fired ≥ 3 times in 7 days without an incident | `bug` when a threshold or AC is violated, else `task` (tune or remove the alert) | Link the alert name and the readings |
| Indicator reading below target | `story` | Dispatch the Product Manager (first indicator reading trigger); link `specs/NNN-slug/ops.md` |
| Incident with an unknown `AC-n` (`untraced-requirement`) | `story` when the behaviour was never specified; `bug` when a spec covers it but no AC names it | Link the spec ID; the missing AC is written in Specify |
| Retro action `RA-YYYYMMDD-n` | `task` (it changes a file the next cycle reads: AGENTS.md block, checklist, test, CI check, script) | Due date ≤ 14 days from the retro; the closing commit carries `Refs: RA-YYYYMMDD-n` |
| Retro action that adds an automated control after a recurring cause tag | `task` | Keep the named approver from the retro record (approver ≠ proposer); a CI check change with an `auth` or `regulated` aspect still scores R |

## 6. Worked examples

| Request | Class | Reasoning |
|---|---|---|
| "The date column shows UTC instead of my time zone" | `bug` | The settings page promises local time (written expectation) |
| "Export to Excel would be nice" | `story` | No expectation exists; users notice a new export |
| "Bump the HTTP client from 4.2 to 5.0" | `task` | No user notices; check the diff for `public API` |
| "Find out whether the payment provider supports partial refunds" | `task` · `spike` | Output is a finding; timebox 1 day |
| "Customer portal: self-service sign-up, invoices, and support chat" | `epic` | Three goals, each ships alone → capability map |
| "Login button says 'Sing in'" | `bug` | Copy deviates from the documented label; Quick by score (S=3, R=0) even though it is user-visible |
| Postmortem action RA: "add a test that fails when the export job runs without a row limit" | `task` | Retro action with a target test file |

## Sources

Adapted from Matt Pocock's skills (MIT) triage categories, BMad Method's (MIT) single-goal scope standard, intake by container and slicing rules, and Addy Osmani's agent-skills (MIT) scope check. Text is original.
