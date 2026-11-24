# Level selection — AC → level → case

Load at workflow Step 3 for every AC, and again when a Reviewer L1 finding says a test sits at the wrong level. The contract is `../../agentic-sdlc/references/verification.md` §2 ("lowest test level that observes the outcome: unit < integration < end-to-end"); this file is the rubric behind that sentence.

The `Level` column of `acceptance-tests.md` accepts exactly three values: `unit`, `integration`, `end-to-end`. Two further outcomes of this rubric are **not** Map levels: a contract test is written in the Map as `integration` and its failure sentence starts with `contract:`; a check only a person can judge goes to a UX Designer check (`UX-n` / `A-n`) or to `## Not verifiable before release`.

## 1. Decision rubric (first match wins)

Ask each question about the **observable outcome named in the AC**, not about the code that will produce it.

| # | Question | Yes → | Map value | Typical double |
|---|---|---|---|---|
| 1 | Is the outcome only observable in production (real volume, a third party without a sandbox, physical hardware, legal judgement)? | `CANNOT_VERIFY` row with reason, check done instead, verifier, date ≤ 14 days after release | — (not a Map row) | — |
| 2 | Is the outcome a rendered result only a person can judge (visual layout, copy tone, screen-reader experience, motion)? | UX Designer check `UX-n` / `A-n` in `ux.md` §Test-stage checks | — (not a Map row) | — |
| 3 | Can the outcome be read from the return value of one function or module with no I/O (pure transform, validation, formatting, calculation)? | unit | `unit` | none |
| 4 | Does the outcome cross a boundary the team owns (HTTP route, database query, filesystem, queue, CLI process) and does a local stand-in exist (test database container, temp directory, in-memory queue)? | integration with the real stand-in | `integration` | real stand-in; fakes only at process boundaries |
| 5 | Is the outcome an agreement with a consumer outside this change (public API schema, status codes, event payload, another team's service)? | contract test at the provider or consumer side, in the project's contract tool when one exists | `integration` + `contract:` prefix | recorded consumer expectations, schema files |
| 6 | Does the outcome depend on the wiring between the user-facing client and the server (what is shown equals what is sent; a journey crosses several screens)? | end-to-end, at most one test per journey `J-n` unless a Critical AC needs another | `end-to-end` | seeded test environment; never production |

**Seam rule (correct seam over lowest seam).** The lowest level that *observes* the outcome is not always the lowest level available. When the risk sits in the wiring — a permission check that must run on the route, a filter that must reach the query — a unit test on the helper passes while the route ships unprotected. Test at the seam where the defect named in "Failure it catches" would live. A seam too shallow to catch it is a wrong level; no correct seam at all is a **finding** ("no test seam for AC-n"), reported with status `BLOCKED` for that AC, never covered by a test that cannot fail.

**One public interface per seam.** Tests cross the same interface the callers use (function signature in the plan task, HTTP route, CLI flags, rendered page). A test that reaches past the interface (private method, internal table queried behind the API, call order of collaborators) is implementation-coupled and is redesigned.

## 2. Dependency categories → which double

Classify every dependency the outcome touches before choosing doubles. Mocks are allowed only at process boundaries: network, clock, randomness, filesystem outside the test's temporary directory, third-party APIs (`../../agentic-sdlc/references/tdd.md` §1 rule 3).

| Category | Example | In the acceptance test |
|---|---|---|
| In-process | CSV escaping, money rounding, date formatting | Real code; no double |
| Local stand-in exists | Postgres → container or embedded engine; filesystem → temp dir | The stand-in, seeded with synthetic data |
| Owned but remote | The team's own pricing service over HTTP | An in-memory or recorded fake at the network edge; the provider side gets its own contract test |
| True external | Payment provider, email provider, maps API | A fake at the network boundary returning complete, documented payloads (all fields, success and each error shape) |
| Time and randomness | "7 days overdue", retry back-off, generated IDs | Injected clock and seed; never `sleep` |

A fake with branching logic, partial payloads or more than one mocked collaborator per test needs a one-line justification comment; without it, redesign the test.

## 3. Pyramid ratios — guidance, not law

The classic shape for a whole suite is roughly 80 % unit, 15 % integration, 5 % end-to-end. An **acceptance suite for one spec** is different: ACs describe outcomes at boundaries, so integration rows usually dominate. Use these as warning thresholds that need a one-line justification in the Map preamble, not as targets:

| Signal | Threshold | Usual cause | Action |
|---|---|---|---|
| End-to-end rows | > 1 per journey `J-n`, or > 25 % of rows | Testing logic through the browser | Move logic cases down to integration or unit; keep one journey test |
| Unit rows on an AC with a risk trigger | Any, when no integration row covers the same AC | Seam too shallow | Add the integration row at the correct seam |
| All rows at one level | 100 % unit or 100 % end-to-end with ≥ 4 ACs | Default habit | Re-run the rubric per AC |
| Wall time of the acceptance suite | > 5 min locally | E2E or real network | Re-level; replace waits with conditions |

The worked example `../../agentic-sdlc/examples/worked-example/specs/001-csv-export/acceptance-tests.md` has 10 rows: 2 unit (CSV escaping), 7 integration (route + seeded database), 1 end-to-end (journey J-1). That shape is typical.

## 4. Worked decisions

| AC (abridged) | Rubric hit | Level | Why not another level |
|---|---|---|---|
| "Cells starting with = + - @ are prefixed with a quote" | 3 | `unit` | Pure transform; integration adds nothing the escaping function does not show |
| "A user without `reports:export` gets 403 and no file" | 4 (seam rule) | `integration` | A unit test of the permission helper passes even if the route never calls it |
| "Export button downloads the rows shown on the page" | 6 | `end-to-end` | Only the browser shows that the client sends the displayed filters |
| "`GET /v2/orders` keeps the `total` field as a decimal string" | 5 | `integration` + `contract:` | Mobile clients depend on the type; a provider contract test catches a silent change to a number |
| "`--dry-run` prints the plan and writes nothing" (CLI) | 4 | `integration` | Run the built CLI as a process against a temp directory; assert stdout and the empty directory |
| "Reminder email reads correctly on a phone" | 2 | UX Designer check `UX-3` | Rendering judgement; an automated test can only check the template variables (add that as a unit row) |
| "Payment provider settles within 24 h" | 1 | `CANNOT_VERIFY` | Provider sandbox does not settle; verifier: Finance ops, date: release + 3 days |
| "p95 ≤ 3 s for 50,000 rows on the staging data set" | 4 + NFR | `integration` (timed) | Load the stated volume; see `nfr-checks.md` §Performance |

## 5. From level to cases

For each AC, after the level is fixed, generate cases from the scenario classes in `case-design.md` §1 and keep only those that can turn red for a defect named in one sentence. Typical counts: 1–2 cases for a normal AC, 2–4 for a Critical AC or one that handles input, permissions or limits (≥ 1 negative is mandatory there).
