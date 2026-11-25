# Escalation Report and Debug Records

Load in Step 5 to record each hypothesis round, and in Step 9 when a bound is reached. The contract (bounds, breakers, allowed rulings) is `../agentic-sdlc/references/loops.md` §1, §6, §7; this file gives the formats that carry a debugging session across rounds, compaction and the hand-off to the Architect.

## 1. Hypothesis log (kept in the task notes, mirrored in the ledger)

One block per session, written in Step 4 before the first probe and updated after each probe:

```text
HYPOTHESES · T3 · BUG-418 · red loop: npx vitest run tests/export.test.ts -t "BUG-418" (10/10 red)
H1 [code]  If the row count is read after the first page is streamed, then a 50,001-row request with page size 50,000
           returns 200 and with page size 60,000 returns 422.            Probe: page size 60,000 · Status: REFUTED (still 200)
H2 [code]  If the limit check compares with > instead of >=, then exactly 50,000 rows is rejected.
                                                                           Probe: request 50,000 rows · Status: REFUTED (200, correct)
H3 [env]   If the test config sets EXPORT_MAX_ROWS (SET) and overrides the default, then unsetting it returns 422.
                                                                           Probe: run with the variable UNSET · Status: REFUTED (still 200)
H4 [design] If filtering happens after export, the limit counts unfiltered rows.  Status: untested
```

Rules: 3–5 hypotheses, ranked most likely first; each has a category (`spec`, `design`, `plan`, `code`, `test`, `env`), a falsifiable prediction and one probe that changes one variable. Statuses: `untested`, `REFUTED`, `CONFIRMED`, `INCONCLUSIVE` (allowed once per hypothesis; a second inconclusive probe counts as refuted).

## 2. Ledger rows per probe

Each tested hypothesis is one round of the `debug` loop. A refuted hypothesis is a failed round:

```bash
node ../agentic-sdlc/scripts/run-ledger.mjs round --run r1 --task T3 --loop debug --result fail \
  --signature 'export.test BUG-418: expected 422, got 200' --cause code \
  --tried 'H1: row count read after first page streamed — refuted: page size 60,000 still returns 200'
```

The proven root cause is a passing round (a different session, BUG-430, where the second hypothesis held):

```bash
node ../agentic-sdlc/scripts/run-ledger.mjs round --run r2 --task T5 --loop debug --result pass --cause env \
  --tried 'H2: REPORT_TZ unset in CI falls back to UTC — confirmed: BUG-430 test red with UNSET, green with Europe/Lisbon'
```

| Field | Rule |
|---|---|
| `--signature` | First failing test name + first error line; durations, line:column positions and memory addresses removed |
| `--cause` | The category the evidence points to after this probe. `unknown` is allowed in one round per task; a second `unknown` fires breaker B6 (treated as `design`, to the Tech Lead). `spec`, `design` or `plan` fires B6 at once |
| `--tried` | `H<n>: <hypothesis> — <refuted|confirmed>: <observed result>`; never repeat a `--tried` text (the ledger rejects it, exit 1) |

Node absent, or Quick path without `plan.md` → append the same columns (`Date · Task · Loop · Round · Failure signature · Cause · Tried · Result`) to `plan.md` `## Loop ledger`, or to the PR body below the Verification table, and count the rounds there.

## 3. Escalation brief (Step 9)

`run-ledger` prints the brief at exit 3. Without Node, write the same five lines by hand, then add the debugging attachment below them.

```text
ESCALATE · run r1 · T3 · B5 debug cap → Architect
Why: debug bound 3 reached · loop debug · round 3 · cause code
Failure signature: export.test BUG-418: expected 422, got 200
Tried:
  1) [debug r1] H1: row count read after first page streamed — refuted: page size 60,000 still returns 200 → fail
  2) [debug r2] H2: limit compares with > instead of >= — refuted: 50,000 rows returns 200 as specified → fail
  3) [debug r3] H3: config override of EXPORT_MAX_ROWS — refuted: variable UNSET, still 200 → fail
Ruling requested (one of): reroute | split | handover | drop
Record: run-ledger ruling --run r1 --task T3 --by "<role: name>" --decision <ruling> --note "<text>"

Debugging attachment
Red loop:        npx vitest run tests/export.test.ts -t "BUG-418" · 10/10 red · 1.8 s · fingerprint 3f9a0c2b71de
Minimal case:    tests/fixtures/export-50001.json, filter region=all, page size default
Trace so far:    L0 export-service.ts:88 check passes with count=50,000 → L1 repo.ts:41 count() runs before filter join → L2 not traced (query builder)
Untested:        H4 [design] limit counts rows before the filter is applied (prediction: filtered 49,000 of 60,000 → 422)
Design question: should the limit apply to the filtered row count (AC-4 text) or to the source table (current repository design)?
Evidence links:  ledger rows debug r1–r3 · probe output tagged DEBUG-7c1e (removed from code; kept in task notes)
```

The attachment turns the brief into a design question. The Architect rules on the question, naming the evidence used (`../agentic-sdlc/agents/architect.md`); the human records the ruling. In attended mode end the turn after the brief; in unattended mode the escalation is also a halt with reason `loop-bound`.

## 4. Anti-thrash brief (B2) during the fix

After the root cause is proven, a fix that fails is a `build-test` round. Two consecutive failed rounds with the same normalized signature, or 3 failed fixes on the task since the last ruling, fire B2 → Architect. The brief has the same shape; the attachment adds the proven root cause, the regression test name and why each fix did not hold. One extra round in a fresh context (task, ledger rows, failing output only) is permitted before a B2 escalation when no stronger model is available; it counts toward the same bound.

## 5. Other stop reports

| Situation | Status | Content |
|---|---|---|
| No red loop after 3 constructions | `NEEDS_CONTEXT` | `NO RED LOOP` block (`references/red-loop-construction.md` §5) |
| Root cause category `spec` | `BLOCKED` (B6 → Product Owner) | The two contradicting ACs or the AC that cannot be met, quoted with IDs; Specify sign-off is void |
| Root cause category `design` or `plan` | `BLOCKED` (B6 → Tech Lead) | The interface or task boundary that cannot satisfy the AC; Design sign-off is void |
| Root cause proven but no correct seam for a regression test | `DONE_WITH_CONCERNS` | `missing seam:` the call path, why a shallower test would pass with the bug present, the manual evidence used instead; the dispatcher opens an Important finding |
| `env` cause | round recorded with `--cause env` | Preflight must pass before the next task starts (`../agentic-sdlc/scripts/preflight.mjs`) |

## 6. Commit message after the fix

```text
fix(export): apply the row limit to the filtered count

Root cause: count() ran on the source table before the region filter join (H4). Confirmed after the
B5 escalation: ruling "reroute" to Design; plan rev 3 states the limit applies to filtered rows (AC-4).
Refuted: H1 page-size ordering, H2 off-by-one comparison, H3 config override.
Regression: BUG-418 export of 50,001 filtered rows returns 422 (red before, green after).

Refs: T3 AC-4
```

The confirmed hypothesis and the refuted ones are stated so the next person debugging this area starts from evidence.
