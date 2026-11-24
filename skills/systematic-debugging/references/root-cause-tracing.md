# Root-Cause Tracing and Defense in Depth

Load in Step 2 when the error appears far from where the bad value was created (deep in a call chain, in a library, in a pipeline stage), in Step 6 to locate the origin before writing the regression test, and in Step 7 to add the layered guards after the fix.

## 1. Trace backwards

The line that throws is the **symptom site**. The root cause is where the bad value, state or ordering was first introduced. Fixing at the symptom site leaves every other path to the same bad value open.

Procedure:

1. **Symptom.** Copy the full error: message, code, file:line of the throw, and the whole stack. Read it to the end; the frame that matters is often not the top one.
2. **Immediate cause.** At the throwing line, name the value that was wrong and what it should have been (`dir = ""`, expected an absolute temp path).
3. **One level up.** Ask "which caller passed this value?" Open that frame. Record the value as it was received and as it was passed on.
4. **Repeat** until reaching the first frame where the value was correct on entry and wrong on exit, or was created wrong. That frame is the origin.
5. **Write the chain** in the task notes, one line per level:

```text
TRACE · BUG-212 · symptom: git init ran inside the repository root
L0  workspace.ts:88   gitInit(dir="")            → runs in process.cwd()
L1  workspace.ts:41   createWorkspace(dir="")    ← passed through unchanged
L2  session.ts:117    new Session({ root: ctx.tempDir })   ctx.tempDir === "" at this point
L3  session.test.ts:9 ctx read in describe() body, before beforeEach() assigned tempDir   ← ORIGIN
```

6. **Cannot go one level up** (no source, generated code, async boundary lost the stack) → instrument just before the dangerous operation (§2) and run the red loop. Never fix the symptom site because the trace stopped.

## 2. Instrumentation that finds the next level

| Situation | Instrument |
|---|---|
| A value is wrong at the symptom site | Just before the operation, print the argument, the working directory, the relevant environment variable names with SET/UNSET, and a stack trace (`new Error().stack`, `traceback.print_stack()`, `Thread.dumpStack()`) |
| A pipeline of components (CI job → build script → signing; API → service → database) | At each boundary print what enters and what leaves; run once; the first boundary where input is right and output is wrong is the component to investigate |
| Logs are swallowed by the test runner | Write to stderr directly, not through the application logger the tests silence |
| Many tests could trigger it | Include the test name in the line, run the suite, filter on the tag: `npx vitest run 2>&1 \| grep 'DEBUG-7c1e'` |

**Tag every probe** with one unique prefix per debugging session, for example `[DEBUG-7c1e]`. Cleanup in Step 8 is a single search: `git grep -n "DEBUG-7c1e"` must print nothing before the commit. Untagged probes survive into commits.

**Never print secret values.** Print `TOKEN=SET` or `TOKEN=UNSET`, a length, or the last 4 characters at most. Personal data from production stays out of probes and fixtures (`../agentic-sdlc/references/rules.md`, rule 7).

**Prefer a debugger** when one is available for the runtime: one breakpoint at the origin candidate replaces ten print lines. Debugger sessions still need the result written to the task notes.

## 3. Fix at the origin

The fix changes the origin frame (L3 above: read `tempDir` only after setup, and make early access throw). The regression test of Step 6 exercises the origin through the same seam the bug used; a unit test of the symptom site alone gives false confidence when the bug came from a different caller.

## 4. Defense in depth (Step 7)

After the origin is fixed, add a guard at each layer the bad value passed through, so that a different path to the same bad value fails loudly at the first layer instead of silently at the last.

| Layer | Guard | Example (empty directory bug) |
|---|---|---|
| 1 · Entry point | Reject missing, empty or wrong-type input at the public boundary with a specific error | `createWorkspace("")` throws `workspace directory is required` |
| 2 · Domain logic | Check that the value makes sense for this operation | the directory must be absolute and must not be the repository root |
| 3 · Environment guard | Refuse dangerous operations in contexts where they are never legitimate | in the test environment, `gitInit` refuses any path outside the OS temporary directory |
| 4 · Diagnostic context | Keep a permanent, non-secret log line before the dangerous operation | `workspace: init git at <path> (caller <name>)` at debug level |

Rules:

1. **Test each layer by bypassing the previous one.** Call layer 2 directly with the bad value; it must fail even though layer 1 was skipped. One test per layer, named after the bug (`BUG-212 layer 2 rejects the repository root`).
2. **Guards are in scope only on the touched path.** Add layers only to files listed in the task's `Files`; a guard elsewhere is a new task or a follow-up issue (out-of-plan files halt rule, `../agentic-sdlc/references/autonomous.md` §3).
3. **No abstraction for one guard.** A validation helper needs ≥ 2 current call sites (`../agentic-sdlc/references/tdd.md` rule 4).
4. **Layer 4 is not a debug probe.** It is untagged, permanent, at debug level, and carries no secret or personal data; temporary `[DEBUG-…]` probes are still removed.

## 5. Worked mini-example

Symptom: `TypeError: Cannot read properties of undefined (reading 'currency')` in `formatTotal`, report rendering, only for some customers.

- L0 `format.ts:12` `formatTotal(order)` — `order.price` undefined.
- L1 `report.ts:57` maps rows from `loadOrders()` — rows with `status = 'draft'` have no price.
- L2 `orders-repo.ts:30` query has no status filter since commit `a1b2c3d` ("include drafts for audit view").
- Origin: L2. Cause category `code` (a filter dropped by an unrelated change), not `spec`.
- Fix at L2: the report query filters `status <> 'draft'`; the audit view keeps its own query.
- Layers: L1 rejects a row without price with `report row <id> has no price` (layer 2 domain check); `formatTotal` asserts its input type (layer 1 at its own boundary).
- Regression test `BUG-388 report excludes draft orders` at the repository seam, red before the fix.
