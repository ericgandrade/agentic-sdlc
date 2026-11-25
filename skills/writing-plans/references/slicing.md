# Slicing — vertical slices, tracer bullet, expand–contract, sizing, parallelism

Load this file in Step 2 of the workflow, when turning acceptance criteria into the `## Tasks` table, and whenever `plan-graph` reports `SIZE_BOUND`, `TASK_BOUND`, `CYCLE` or a wave plan with a frontier of 1 for most waves. The bounds here are those of `../../agentic-sdlc/scripts/plan-graph.mjs` (8h per task, 15 tasks, frontier ≤ 3) and `../../agentic-sdlc/references/paths.md` §4 (Standard ≤ 15 files).

## 1. Vertical, not horizontal

A slice is a narrow path through **every layer the behaviour needs** — storage, domain, transport, UI, tests — that a user or caller could observe on its own. A horizontal layer ("all models", "all endpoints", "the UI") is never a task: it cannot be tested against an AC, it hides integration defects until the last task, and it forces every later task to block on it.

| Horizontal (rejected) | Vertical (accepted) |
|---|---|
| T1 Create the counter store · T2 Write the middleware · T3 Add headers · T4 Wire everything | T2 Refuse request 101 with 429 (store + middleware + wiring + HTTP test) · T3 Report remaining requests in headers |
| T1 Database migration for invoices · T2 Invoice API · T3 Invoice page | T1 Create a draft invoice and see it listed · T2 Send an invoice · T3 Mark an invoice paid |
| T1 Add all validation rules | T1 Reject a past due date (AC-2) · T2 Reject an amount above the credit limit (AC-3) |

Test for a vertical slice: its red test is named after an AC and exercises the behaviour from the outside (HTTP call, CLI run, rendered component, public function), not an internal helper.

## 2. Ordering: prefactor, tracer bullet, riskiest next

1. **Prefactor (optional, first).** "Make the change easy, then make the easy change." When the feature needs a seam that does not exist (key lookup scattered across handlers, a god function), the first task creates it without changing behaviour. It lists the AC it enables, its red test pins the new seam, and the existing tests stay green. A prefactor that changes no behaviour and has no new test is a `--no-red` task; prefer giving it a characterization or seam test so the one allowed `--no-red` stays free for docs.
2. **Tracer bullet (first behaviour task).** The thinnest end-to-end slice that proves the architecture: real entry point, real wiring, the simplest store, one AC. It fixes the interfaces every later task codes against (store contract, error body, config keys). Everything else blocks on it — which is the point: the tracer bullet is the only task that must be serial.
3. **Least certain next.** After the tracer bullet, order by uncertainty, not by convenience: the external integration, the performance-sensitive path, the migration. A plan that leaves its riskiest task for last learns the bad news when nothing can be re-planned.
4. **Breadth after.** The remaining ACs as independent slices blocked only by the tracer bullet, so they form a wide frontier.
5. **Docs last,** blocked by the slice whose behaviour they document (Tech Writer when the docs trigger fires).

## 3. Slicing pattern catalogue

| Pattern | Use when | Example tasks |
|---|---|---|
| One AC per slice | ACs are independent behaviours | AC-2 → T3, AC-3 → T5 |
| Happy path, then edges | One AC has a main flow and several refusals | T2 export 100 rows · T3 refuse > 50,000 rows · T4 refuse without permission |
| Contract first | Two sides (API and client, producer and consumer) are built in parallel | T1 fix the contract and a contract test · T2 server side · T3 client side, both blocked by T1 only |
| Stub then real | The real backend is slow or risky to integrate | T2 tracer bullet on an in-memory store · T4 real store implementing the same interface |
| Flag-gated | The behaviour must ship dark or roll back with a switch | Tracer bullet adds the flag (default off); later slices stay behind it |
| Read before write | A new entity needs both | T1 list (with seeded data) · T2 create · T3 update |
| Expand–contract | Schema or public API changes with live callers | §5 |
| Strangler | Replacing a legacy path one route at a time | T1 route 1 via new path behind flag · T2 route 2 · T3 remove legacy |
| Characterize then change | Untested legacy code | `CHAR-n` tests first inside the task that changes it |

## 4. Size bounds and how to split

| Bound | Value | Source | When exceeded |
|---|---|---|---|
| Task size | ≤ 8h (`1d`) | `SIZE_BOUND` | Split; never re-estimate down |
| Steps per task | ≤ 6 numbered steps of 2–5 min | template | Split |
| Files per task | ~5 as a signal (not a hard bound) | slicing practice | Look for an "and" in the title; split there |
| Tasks per plan | ≤ 15 | `TASK_BOUND` | Split the spec in the Specify stage, never merge tasks to fit |
| Files per Standard plan | ≤ 15 distinct paths (lockfiles and generated files excluded) | paths.md §2, §4 | Stop; re-score with the Analyst; route up |
| Prose | ≤ 3,000 words Standard, ≤ 6,000 Full | `WORD_BOUND` | Cut narrative; move rationale to an ADR |

**Split, never shrink.** When a task is too big, the fix is two tasks, not a smaller number in the Size column and not fewer tests. Split lines that work:

- On the word "and" in the title ("Count requests **and** fail open" → count; fail open).
- On the AC: one task per AC when one task served three.
- On the edge cases: happy path first, refusals second.
- On the layer only when the lower layer is independently testable through a public interface (a library function with its own callers); otherwise it is a horizontal slice in disguise.

**Merge only** when two tasks would each be under 1h, share all their Files and serve the same AC; a merge never creates a task above 8h.

## 5. Expand–contract for schema and public API changes

Any change that would break live callers or stored data in one step — renaming a column, changing a response field, tightening a type, moving an endpoint — is sequenced in three phases so every commit leaves the build green and the system deployable:

| Phase | Task shape | Blocked by | Verification |
|---|---|---|---|
| **Expand** | Add the new form beside the old: new column (nullable) + dual write; new field in the response next to the old; new endpoint next to the old | tracer bullet or — | Old and new readers both pass; migration up and down both run |
| **Migrate** (1..n batches) | Move one set of callers or one data batch to the new form; backfill in bounded batches | Expand | Batch tests green; full DoD green after each batch |
| **Contract** | Remove the old form: drop the column, the field, the endpoint; remove dual write | **every** migrate batch | Search for the old name returns no hits outside the migration; DoD green |

Rules:

- Migrate batches touch disjoint Files (one package, one service, one directory each) so `plan-graph` puts them in one wave and the Build stage runs up to 3 in parallel.
- Contract never shares a release with expand when data or external clients are involved: the plan says which release carries it, and the Risks table names the observation window (for example "7 days with zero reads of `customer_id`").
- Every migration task lists the migration file and a down/rollback step with its command; the spec's `## Rollback` is the source.
- A schema change is a risk trigger and a public-API change is another (`../../agentic-sdlc/references/paths.md` §2). Both in one spec make R ≥ 2, which is the **Full** path; a plan that finds a schema change the spec score did not list stops and re-scores (rule 11 in `../../agentic-sdlc/references/rules.md`) instead of continuing on Standard.
- Wide mechanical refactors (a rename across a monorepo) use the same shape: expand (alias or new name), migrate per package, contract (remove alias). They are the one allowed exception to vertical slicing.

## 6. Designing for parallelism

The Build stage runs a **frontier**: ready tasks (every blocker committed) with pairwise disjoint Files, at most 3 at once, each in its own worktree (`executing-plans`). `plan-graph` computes waves as 1 + the highest blocker wave, then moves the higher ID of any same-wave pair with overlapping Files to the next wave.

To widen the frontier:

1. **Delete false edges** (`references/plan-format.md` §3). Each removed edge can pull a task one or more waves earlier.
2. **Separate shared files.** Two slices that both edit a central registry (`routes/index.ts`, `server.ts`) collide. Options: let the tracer bullet create the registration point for all later slices; give each slice its own file and register them by convention or glob; or accept the conflict where it is one line and the waves are already short.
3. **Separate test files.** A shared test file is the most common conflict. One test file per slice (`rate-limit.headers.test.ts`, `rate-limit.exempt.test.ts`) frees the frontier at no design cost.
4. **Avoid directory and glob entries** in Files; each one serializes every task under it.
5. **Keep migrate batches disjoint** (§5).

Read the waves line before presenting: `W1 T1 · W2 T2 · W3 T3 T4 · W4 T5 T6` is healthy for six tasks with a prefactor and a tracer bullet. A plan whose waves are all single tasks is a chain; check each edge with the real-dependency test before accepting it. A conflict line (`conflict: T3/T5 share ...`) is information, not an error; leave it when splitting the file would add design without saving a wave.

## 7. Worked mini-example — from ACs to a table

Spec 007-api-rate-limit (Standard, R=1 public API) has five ACs: 429 on request 101 (AC-1), two headers (AC-2), exempt keys (AC-3), fail open on store outage (AC-4), public docs (AC-5).

1. Seam needed? Key lookup is scattered across v1 handlers → **T1 prefactor**, enables AC-1.
2. Tracer bullet: flag + middleware + in-memory store + wiring + HTTP test for AC-1, and the store contract's `null` meaning for AC-4 → **T2**, blocked by T1.
3. Least certain next: the Redis store and its failure mode → **T4**, blocked by T2 only (it implements T2's interface).
4. Breadth: headers → **T3**; exempt keys → **T5**; both blocked by T2.
5. Docs → **T6**, blocked by T3 (documents the headers), Tech Writer, the plan's one `--no-red` task.
6. Files: 14 distinct paths against the Standard bound of 15 → a Risk row.
7. `plan-graph`: `W1 T1 · W2 T2 · W3 T3 T4 · W4 T5 T6`; T5 conflicts with T3 (middleware and its test) and with T4 (`src/server.ts`). Accepted: splitting the middleware test file would save no wave because T5 also needs `src/server.ts`.

The full plan is `../examples/007-api-rate-limit/plan.md`.

## 8. Red flags while slicing

| Signal | Meaning | Action |
|---|---|---|
| A task title names a layer ("models", "API", "UI") | Horizontal slice | Re-slice by behaviour |
| A task serves no AC and enables none | Scope outside the spec | Remove it or raise a spec change |
| Every task blocks on the previous one | False edges | Apply the real-dependency test to each edge |
| The riskiest integration is the last task | Late discovery | Move it right after the tracer bullet |
| Two `--no-red` tasks | Untested behaviour or split docs | Merge docs or add tests |
| A migration task with no down step | No rollback | Add the down command from the spec's Rollback |
| Size `8h` on several tasks | Estimates pinned to the bound | Split them; an 8h estimate is usually 12h |
