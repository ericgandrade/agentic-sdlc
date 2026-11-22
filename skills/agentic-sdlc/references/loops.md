# Agentic SDLC — Bounded Loops, Routing and Escalation

Loaded when a test, build or review round fails (mechanisms 6.1–6.5; 6.6 enforcement by `scripts/run-ledger.mjs`). One rule governs every loop: **a loop has an exit, a bound and a named human at the bound.** Exit code `3` from any script means the bound is reached: stop and escalate.

## 1. Loop catalogue (6.1)

| Loop | Exit | Bound | At the bound | Breaker |
|---|---|---|---|---|
| Red-green | target test green | **3 failed attempts** | switch to the debug loop (automatic, no ruling) | B1 |
| Build-test fix | DoD + AC tests green | **5 rounds per task** (lower with `budgets.max_rounds`) | `ESCALATE` → Tech Lead | B3 |
| Review-fix | 0 open Critical findings | **3 review rounds** | `ESCALATE` → Tech Lead | B4 |
| Debug | root cause proven by a test | **3 refuted hypotheses** | `ESCALATE` → Architect | B5 |

| Element | Rule |
|---|---|
| **Artifact** | This catalogue; `round` events in `.agentic-sdlc/runs/<id>/ledger.jsonl`; rows in `plan.md` `## Loop ledger` |
| **Trigger** | Every failed round in Build or Test |
| **Output** | One ledger event per round; an escalation brief (§7) at a bound |
| **Failure behaviour** | `run-ledger round` exits 3 at the bound and refuses every further round on the task until a ruling is recorded |

**One counter.** A round is one fix attempt followed by its re-check. Each task carries one failed-fix counter per loop; the anti-thrash breaker (§6) fires at 3 failed build-test fixes, before the hard cap of 5. A ruling `continue` resets the anti-thrash count only; the hard cap counts every round of the loop. A passing debug round resets the red-green count.

Review-fix rounds belong to the task whose code the finding names (`--task T3`) or to `PR` for findings that span tasks. One review round = one Reviewer pass; open Critical findings → `fail`; the fixes are the next round's `--tried`.

## 2. Root-cause routing (6.2)

| Element | Rule |
|---|---|
| **Artifact** | The `cause` field of every failed round (`--cause`) and the Cause column of the loop ledger |
| **Trigger** | Each failed round, before the next fix |
| **Output** | The stage the work returns to |
| **Failure behaviour** | Cause `unknown` in 2 rounds of one task → treated as `design` (B6). `spec`, `design` or `plan` → B6 at once; the related approval is void |

| Cause | Evidence that names it | Return to | Approval effect |
|---|---|---|---|
| `spec` | ACs contradict each other, or an AC cannot be met as written | Specify (Product Owner) | Spec approval void → change protocol (`references/rules.md`) |
| `design` | Interface or architecture in the plan cannot satisfy the AC | Design (Tech Lead, Architect) | Plan approval void |
| `plan` | Task order, Files or Blocked by is wrong | Design | Plan approval void |
| `code` | Implementation defect | Build, same task | none |
| `test` | The test itself is wrong (fixture, assertion, anti-pattern in `references/tdd.md` §3) | Build, same task | none |
| `env` | Tool missing, service down, flaky infrastructure | preflight (`scripts/preflight.mjs`) before the next round | none |
| `unknown` | No evidence yet | Build, at most 1 round | 2nd `unknown` → B6 as `design` |

An `env` failure clears the preflight: `run-ledger` refuses the next task start until `preflight` passes again.

## 3. State carried across rounds (6.3)

| Element | Rule |
|---|---|
| **Artifact** | Run ledger events (`round`, `ruling`, `halt`); `plan.md` `## Loop ledger` table (`Date · Task · Loop · Round · Failure signature · Cause · Tried · Result`), excluded from the plan hash |
| **Trigger** | Every round, pass or fail |
| **Output** | `run-ledger render --run <id>` prints the table rows; copy them into `plan.md` at each task exit and into the PR |
| **Failure behaviour** | A `--tried` already recorded for the task in the same loop → exit 1 ("already tried"); a failed round without `--signature`, `--cause` and `--tried` → exit 2 |

**Failure signature** = first failing test name + first error line, with durations, line:column positions and memory addresses removed before comparison. Read the ledger before each round: the round number, the signatures seen and every approach tried. The ledger survives compaction; memory does not.

```bash
node <skill>/scripts/run-ledger.mjs round --run r1 --task T3 --loop build-test --result fail \
  --signature 'export.test AC-4: expected 422, got 200' --cause code --tried 'count before first write'
```

Node absent → append the same row to `plan.md` `## Loop ledger` by hand and count the rounds there.

## 4. Rows per result

`failed` — the round failed. `fixed` — the next round in the same loop passed (its Tried column names the fix). `escalated` — the round hit a breaker; the brief names the target. Ruling and halt rows follow the escalation row.

## 5. Scoped re-check (6.4)

| Element | Rule |
|---|---|
| **Artifact** | `docs/codemap.md` (module → paths → tests) and the plan's `## Impact` table (Mapped tests, Regression scope) |
| **Trigger** | After each fix, before recording the round |
| **Output** | The re-check command and its output in the round report; evidence rows per `references/verification.md` §4 |
| **Failure behaviour** | Mapped set empty (no code map row and no Impact row for a touched file) → run the full test suite |

Re-check set = the failing check + the tests mapped to every file the fix touched. The **full DoD block runs only at loop exit** (task done, PR open). A green scoped re-check never substitutes for the DoD at loop exit.

## 6. Anti-thrash (6.5)

| Element | Rule |
|---|---|
| **Artifact** | Ledger `round` event with `escalation.breaker = B2` and an `escalated` row |
| **Trigger** | Every failed build-test or review-fix round |
| **Output** | Escalation brief to the Architect: a design question, not another fix |
| **Failure behaviour** | Same normalized signature in 2 consecutive rounds, or 3 failed build-test fixes on one task since the last ruling → stop fixing; exit 3 |

## 7. Breakers and rulings

| Breaker | Fires on | Asks | Allowed rulings |
|---|---|---|---|
| B1 | 3 failed red-green attempts | none: automatic switch to debug | — |
| B2 | anti-thrash (§6) | Architect | continue (new approach in `--note`), reroute, split, handover, drop |
| B3 | build-test round 5 failed | Tech Lead | reroute, split, handover, drop |
| B4 | review round 3 with Critical open | Tech Lead | reroute, handover, drop |
| B5 | 3 refuted debug hypotheses | Architect | reroute, split, handover, drop |
| B6 | cause spec/design/plan, or unknown twice | Product Owner (spec) or Tech Lead | reroute, handover |

Meanings: **continue** — same task, new approach stated by the human; **reroute** — back to the stage in §2; **split** — the Planner splits the task (new plan revision); **handover** — a human takes the task; **drop** — removed from scope with a spec revision. Record the ruling:

```bash
node <skill>/scripts/run-ledger.mjs ruling --run r1 --task T3 --decision split --by "Tech Lead: J. Park" --note "split count and stream"
```

**Escalation brief** (printed by `run-ledger` at exit 3; the same five lines by hand without Node): `ESCALATE · run · task · breaker → target` · why (bound or signature) · failure signature · every approach tried with its result · the rulings allowed and the command to record one. In attended mode end the turn and wait. In unattended mode the escalation is also a halt (`references/autonomous.md` §3).

**Fresh context, no stronger model.** Before a B2 or B3 escalation, one extra round in a fresh context that receives only the task, the ledger rows and the failing output is permitted when the platform offers no stronger model; it counts toward the same bound.

## 8. Enforcement

`run-ledger` refuses: a round on an escalated task (exit 3), a red-green round during debug (exit 3), a repeated `--tried` (exit 1), `task --state done` after a failed last round or without red output (exit 1). `preflight` blocks task start after an `env` failure. Without Node the bounds are prompt rules and the PR shows `enforcement: prompt-only`.

## Sources

Bounded fix loops and the "3 failed fixes → question the design" rule adapted from Superpowers `systematic-debugging` (MIT); loop ledger and escalation format are original.
