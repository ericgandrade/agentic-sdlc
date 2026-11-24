# Case design — scenario classes, oracles and the mutation check

Load at workflow Step 1 (testability pass) and Step 2 (cases per AC). The test anti-pattern catalogue A1–A14 in `../../agentic-sdlc/references/tdd.md` §3 applies to every acceptance test; this file adds the design-side rules.

## 1. Scenario classes per AC

Walk each class against the AC text. Keep a case only when the AC (or a spec non-goal, Security note or `ux.md` row) states the expected outcome for it; a class the spec is silent on becomes a question for the Analyst, never an invented expectation.

| Class | Probe | Example from an AC |
|---|---|---|
| Main outcome | The Given/When/Then as written | Filter of N rows → file holds N data rows |
| Empty | 0 items, empty string, missing optional field | Filter matches 0 rows → header row only |
| Boundary | Exactly at, one below, one above every number in the AC | 50,000 rows exports; 50,001 rows returns 422 |
| Invalid input | Wrong type, malformed, injection characters, oversize | Cell starting with `=` is prefixed with a quote |
| Permission | Each role in spec §Users without the needed permission; anonymous | `reports:read` only → no button, 403 on the route |
| Failure of a dependency | Timeout, 5xx, malformed response at a process boundary | Provider 503 → 3 retries, flag set, no 4th call |
| Repetition and concurrency | Double submit, rapid repeat, two sessions | Second click while exporting → one file |
| State transitions | Every state in `ux.md` for the surface | loading → success; loading → error |
| Data class | Fields the spec forbids (personal data, secrets) | Export contains no customer name column |

## 2. Testability pass ("unit tests for the spec")

Before designing, check every AC. A failure here returns the AC to the Analyst with `NEEDS_CONTEXT`; never repair the AC inside the test.

| # | Check | Fails when |
|---|---|---|
| T1 | Observable | The outcome is internal ("the cache is used") rather than visible at an interface |
| T2 | One behaviour | Two outcomes joined by "and" that can fail independently with different causes (split into AT-na/AT-nb is fine; a different actor or trigger is a separate AC) |
| T3 | Measurable | A non-functional word without number and unit ("fast", "scalable", "accessible") |
| T4 | Literal oracle | The expected value cannot be written as a literal or a hand-checked fixture from the spec text |
| T5 | Priority honest | AC touches a risk trigger (auth, personal/health data, money, public API, schema/migration, irreversible, regulated) or a Security note but is `normal` → report to the Analyst before designing |
| T6 | Environment named | An NFR does not name the data set or environment it is measured on |
| T7 | Covered states | A `ux.md` row names `proposed` or no AC and no `pattern:` |

## 3. Name the break (gate per case)

Before writing a test body, write the "Failure it catches" sentence: the production defect that turns this test red. Then apply:

- **No defect nameable** → the case is coverage theatre; drop it or redesign around an observable behaviour.
- **Only an intentional decision would break it** (a constant, a copy string the UX may change) → it is a change detector; test the behaviour that depends on the decision instead. Exception: `ux.md` copy that the spec quotes verbatim (AC-4's message) is the behaviour.
- **The defect is a framework's job** (router registers routes, ORM builds SQL) → test the boundary contract this change owns, not the upstream mechanics.

## 4. Oracles: expected values come from the spec

- Literal values copied from the AC or from a fixture whose expected output was computed by hand and written into the test file.
- Never compute the expected value with the code under test or a helper that mirrors it (tautology, anti-pattern A7). `expect(escape(x)).toBe(escape(x))` and a `reduce` that recomputes the total are both forbidden.
- Table-driven cases with literal `want` columns are preferred for boundary and invalid-input classes.
- Synthetic data only (rule 7): fixed seeds, invented IDs such as `ORD-000001`, no copied production rows.

## 5. Mutation check (before the file is handed off)

Mentally apply each realistic mutation to the behaviour the AC describes. At least one acceptance test must fail for each. An uncaught mutation means a missing case or a weak oracle.

| Mutation | Example | Caught by |
|---|---|---|
| Wrong constant or bound | Limit 50,000 → 5,000 or 50,001 | Boundary pair at, above |
| Wrong branch | Opt-out check inverted | Negative case for the opposite role or flag |
| Missing side effect | Flag `reminder_failed` never written | Assertion on the persisted state |
| Empty or default return | Endpoint returns 200 with empty body | Assertion on content, not only status |
| Missing validation | Formula prefix not escaped for `@` | One row per listed character |
| Missing permission check | Route skips the guard | Negative case per role without permission |
| Extra effect | Retry loop makes a 4th call | Assertion that the call count is exactly 3 |

## 6. Tests that do not count as coverage

A row whose test matches any line below is not coverage for its AC; rewrite it before red-at-base.

- Asserts only "no exception", "status 200" or a snapshot without a named reason.
- Asserts on a mock or a log call instead of the observable result.
- Greps source text, a config file or a skill file for a string.
- Mocks away the integration the AC is about (mocked repository in a test of a query filter).
- Passes through the end-to-end layer without checking the outcome (clicks, then asserts the page loaded).
- Uses a fixture that already contains the expected output (`expect(x ?? DEFAULT).toBe(DEFAULT)`).
- Is skipped, focused, filtered out of the normal command, or not registered with the runner.

## 7. Naming and placement

- Test name: AC ID first, then the outcome in the spec's words — `AC-3 a user without reports:export gets 403 and no file`. Bug-fix specs may add the bug ID after the AC ID.
- Test ID in the Map: `AT-<AC number><letter>` (AT-1a, AT-1b …), stable across revisions; a retired AC keeps its IDs as history.
- File: the project's existing test directory and naming convention for that level (discovered in Step 0); a new directory only when none exists for that level, named in the report.
- One behaviour per test; ≤ 3 act steps; ≤ 50 lines; unit tests ≤ 1 s each.
