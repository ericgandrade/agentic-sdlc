# Acceptance-criteria rubric

Load this file when writing or critiquing the `## Acceptance criteria` table of a spec (Step 4 of the workflow, checklist items 1–3 and 9), when converting EARS requirements, or when a lint run reports `AC0x`.

The format contract is `../../agentic-sdlc/templates/spec.md` § Acceptance criteria and `../../agentic-sdlc/scripts/spec-lint.mjs` rules AC01–AC04. This rubric adds the quality bar the linter cannot check.

## 1. Seven properties of a good AC

| # | Property | Test question | Lint backing |
|---|---|---|---|
| 1 | **Observable** | Could a person outside the team see the outcome (HTTP status, screen copy, file contents, metric, log event) without reading the code? | — |
| 2 | **Testable** | Can the Test Engineer write a pass/fail test from this row alone, with no follow-up question? | AC03 (form) |
| 3 | **Single outcome** | Does the row hold one trigger and one result? Two "then" clauses joined by "and" are fine only when they are the same observable event | — |
| 4 | **Bounded** | Are inputs, sizes, times and limits given as numbers with units or as an exact set? | vague-term check |
| 5 | **Formatted** | Given/When/Then, or a measurable statement containing a number and a unit | AC03 |
| 6 | **Design-free** | Does it state *what* is observed, not *how* it is built (no table names, class names, libraries) unless the interface itself is the product (public API path, CLI flag, file format)? | — |
| 7 | **Traceable and prioritized** | Stable ID `AC-n`, contiguous, never renumbered; priority `critical` or `normal` | AC01, AC02, AC04 |

**Priority rule.** Mark `critical` when failing the criterion loses data, loses money, breaks access control, breaks a legal or contractual obligation, or blocks the main story. Everything else is `normal`. Critical ACs get a negative-path test and are re-run in every fix round.

**ID rule.** IDs are permanent. A dropped criterion becomes `Retired in rev N: <reason>` with priority `—`; the next new criterion takes the next free number. Tasks, tests, commits and PR rows cite `AC-n`, so renumbering breaks the trace chain (`../../agentic-sdlc/references/lifecycle.md` § 4).

## 2. Good / bad pairs

Each pair shows a rejected criterion, why it fails, and a rewrite that passes both the rubric and `spec-lint`.

**1 · Performance without a number**
- Bad: "The orders list loads quickly." — vague term, no load, no percentile, no condition.
- Good: "Given 250,000 orders on the staging data set, when a page of 100 is requested, then p95 latency over 1,000 requests is ≤ 400 ms."

**2 · Design in disguise**
- Bad: "Add a `last_login_at` column to the `users` table and index it." — a task, not an outcome.
- Good: "Given a user who signed in at 09:14 UTC, when an admin opens their profile, then 'Last sign-in' shows 09:14 UTC in the admin's time zone."

**3 · Compound criterion**
- Bad: "Users can export, filter and share reports." — three features, one row, no trigger.
- Good: split into AC-1 (export), AC-2 (filter), AC-3 (share), each with its own Given/When/Then; move any that are not needed now to Non-goals.

**4 · Unbounded input**
- Bad: "The import accepts any CSV file." — no size, no encoding, no row limit.
- Good: "Given a UTF-8 CSV of up to 10 MB and 50,000 rows, when it is uploaded, then all rows are imported and the summary shows the row count."

**5 · Missing negative case**
- Bad: only "Given an admin, when they delete a project, then it is removed."
- Good: add "Given a member without `projects:delete`, when they send DELETE `/projects/42`, then the API returns HTTP 403 and the project still exists."

**6 · Subjective UI**
- Bad: "The error message is user-friendly."
- Good: "Given a card declined by the issuer, when payment fails, then the page shows 'Your card was declined. Try another card or contact your bank.' and keeps the entered address."

**7 · Error handling left implicit**
- Bad: "The system handles payment provider failures gracefully."
- Good: "Given the payment provider returns HTTP 503 three times in a row, when checkout retries, then the order stays `pending`, no charge is created and the user sees 'Payment is delayed; we will email you within 1 h'."

**8 · Idempotency**
- Bad: "Webhooks are processed reliably."
- Good: "Given the same webhook event ID delivered twice within 24 h, when both are processed, then exactly one ledger entry exists for that event."

**9 · Empty state**
- Bad: (no criterion — the empty list is forgotten)
- Good: "Given a workspace with 0 projects, when the projects page opens, then it shows 'No projects yet' and a Create project button."

**10 · Time and time zones**
- Bad: "Reports run at midnight."
- Good: "Given a workspace with time zone America/Sao_Paulo, when the daily report runs, then it covers 00:00–23:59 local time and is emailed by 01:00 local time."

**11 · Unchanged behavior (regression pin)**
- Bad: (no criterion — "the rest keeps working" is assumed)
- Good: "Given a session active for 12 hours, when the user sends a request, then the absolute limit still ends it with HTTP 401." Use this form for every "Must not change" row of a revision (`revise-mode.md`).

**12 · Data boundary**
- Bad: "The export includes the relevant fields."
- Good: "Given a completed export, when compared with data map v3, then every field classed as personal data is present and no field of another account appears."

## 3. Unhappy-path checklist

Run this list against the stories before calling the AC table complete. Each "yes" needs an AC or a Non-goal line.

| Case | Question |
|---|---|
| Permission | Who must *not* be able to do this, and what do they see? |
| Invalid input | What happens with empty, too long, wrong type, out-of-range, malicious (formula, script, path) input? |
| Limits | What happens at the limit, and one past it? |
| Empty and first use | What does a user with no data see? |
| Concurrency | Two users or two requests at once — duplicates, lost updates, ordering? |
| Dependency failure | The database, queue, third-party API or model times out or errors — what does the user see, and what state is left? |
| Retry and idempotency | The same request arrives twice — one effect or two? |
| Time | Time zones, daylight-saving change, expiry, clock skew? |
| Data lifecycle | Retention, deletion, export, audit — any obligation? |
| Rollback | After the flag is turned off, what state remains, and is it safe? |

## 4. EARS option

EARS (Easy Approach to Requirements Syntax) sentences are welcome as the *drafting* form, especially when importing Kiro specs (`format-mapping.md`). Map each pattern to Given/When/Then for the table:

| EARS pattern | Example | Given/When/Then row |
|---|---|---|
| Ubiquitous: "The <system> shall <response>" | The API shall reject cursors from other keys. | Given a cursor issued to key A, when key B sends it, then the API returns HTTP 400 `invalid_cursor`. |
| Event: "When <trigger>, the <system> shall <response>" | When an export completes, the system shall email the holder. | Given a queued export, when it completes, then one email with a download link is sent to the holder. |
| State: "While <state>, the <system> shall <response>" | While maintenance mode is on, the API shall return 503. | Given maintenance mode is on, when any request arrives, then the API returns HTTP 503 with `Retry-After: 600`. |
| Unwanted: "If <condition>, then the <system> shall <response>" | If the provider times out, the system shall keep the order pending. | Given the provider times out after 10 s, when checkout runs, then the order stays `pending` and no charge exists. |
| Optional: "Where <feature>, the <system> shall <response>" | Where SSO is enabled, the system shall hide the password form. | Given SSO is enabled for the workspace, when the sign-in page opens, then no password field is shown. |

`spec-lint` AC03 accepts a row with Given/When/Then, or a row that contains a number and a unit. A raw EARS sentence passes only in the second case. Rewriting as Given/When/Then is the reliable path: "While" → Given, "When/If" → when, "shall" → then. Keep the original EARS sentence in a comment above the table when traceability to a Kiro file matters.

## 5. Size of the AC table

- 3–8 active ACs is typical for a Standard spec; Full specs may reach 12–15.
- More than 15 active ACs or more than 5 stories → re-run the scope check; the spec is probably an epic (`capability-map.md`).
- Every story has ≥ 1 AC; every critical AC has ≥ 1 negative or boundary companion.

## 6. Severity when critiquing ACs

| Finding | Severity |
|---|---|
| Row fails `spec-lint` (AC01–AC04), or a critical AC is untestable | Critical — blocks the sign-off request |
| Two engineers could build different things from the row; missing negative case on a critical AC | Important — fix in this revision |
| Wording, ordering, a clearer noun | Minor — fix or note |
