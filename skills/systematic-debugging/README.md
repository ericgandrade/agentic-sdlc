# systematic-debugging

Build-stage skill of the **Agentic SDLC** (also entered when Test or Operate finds a failure): turns a failure into a proven root cause inside the method's bounded debug loop. It builds a tight, red-capable feedback loop first, minimises and localises, ranks 3–5 falsifiable hypotheses, tests them one at a time with a ledger round per verdict, proves the cause with a regression test at a correct seam, fixes at the origin with defense in depth, and escalates to the **Architect** after 3 refuted hypotheses (breaker B5) or on anti-thrash (B2). Bounds and routing follow `agentic-sdlc/references/loops.md`; regression-test rules follow `agentic-sdlc/references/tdd.md`.

## When to use

- Red-green reached its bound (3 failed attempts → automatic switch to the debug loop).
- A test, build or runtime check fails and the cause is not proven.
- A test passes alone but fails in the full suite, fails only in CI, or flakes.
- A review finding, acceptance test or `from-production` issue reports a defect in Build.
- A fix did not hold, or the failure moved.

Not for new behaviour (`test-driven-development`), plan execution (`executing-plans`), done-claims (`verification-gate`), live incidents (`operations-and-incidents`), or diff review (`multi-axis-code-review`).

## What is included

- `SKILL.md` — minimum loop contract, stop-the-line entry, red-loop gate, triage, comparison with working code, ranked hypotheses, one-at-a-time probes with ledger rounds, regression test at a correct seam, fix at the origin, defense in depth, cleanup, escalation at the bound
- `references/red-loop-construction.md` — loop record and gate, ten constructions, tightening, intermittent bugs, `NO RED LOOP` stop, minimising
- `references/hitl-reproduction-template.md` — human-in-the-loop reproduction script (bash, with a checklist fallback)
- `references/triage-trees.md` — what-changed split, trees per failure kind, order dependence, history bisection, bug intake shape
- `references/root-cause-tracing.md` — backward tracing, boundary probes, tagged logs and cleanup, four-layer defense in depth
- `references/condition-based-waiting.md` — replace sleeps with polled conditions; helpers, patterns, stress proof
- `references/escalation-report.md` — hypothesis log, ledger rows, escalation brief, other stop reports, commit message
- `prompts/hypothesis-challenger.md` — fresh-context attack on the ranked hypotheses (inline fallback)
- `prompts/reproduction-test-writer.md` — regression test written from the symptom alone (inline fallback)
- `scripts/find-polluter.mjs` — dependency-free Node ≥ 18 bisection for the test file that pollutes a target; `--json`; exit 0 found · 1 not found · 2 bad input · 3 bound reached (default 20 runs); tests in `scripts/test/` (`node --test scripts/test/find-polluter.test.mjs`)
- Uses from `agentic-sdlc`: `references/loops.md`, `references/tdd.md`, `references/verification.md`, `scripts/run-ledger.mjs`
- `evals/evals.json` — 5 scenarios (B1 entry, test pollution, timeout pressure, B5 escalation, spec-cause routing)
- `evals/trigger-eval.json` — 18 trigger queries (10 positive, 8 negative)

## Typical invocation

- "Red-green hit the bound on T3 — switch to the debug loop."
- "This test passes alone but fails in the full suite."
- "The checkout test is flaky; find the real cause."
- "The fix didn't hold — the error came back."

```bash
node scripts/find-polluter.mjs --cmd "npx vitest run --no-file-parallelism {files}" \
  --target tests/report.test.ts --files "tests/**/*.test.ts" --json
```

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| SP-57 | Superpowers `systematic-debugging` (MIT) | No fix without root-cause investigation; four phases; compare with working code | Phases mapped to Steps 2–7; Step 3 lists every difference as hypothesis input |
| SP-58 | Superpowers (MIT) | Boundary instrumentation for multi-component failures | Instrumentation table and tagged probes in `root-cause-tracing.md` |
| SP-59 | Superpowers (MIT) | Three failed fixes signal an architectural problem | Bound to the method's breakers: B5 (3 refuted hypotheses) and B2 (3 failed fixes / same signature) → Architect, exit 3 |
| SP-60 | Superpowers `root-cause-tracing` (MIT) | Trace backwards to the original trigger | L0..Ln chain format; fix at the origin |
| SP-61 | Superpowers `defense-in-depth` (MIT) | Validation at every layer | Four layers, each tested by bypassing the previous one; limited to task files |
| SP-62 | Superpowers `condition-based-waiting` (MIT) | Replace arbitrary sleeps with condition polling | JS and Python helpers, timeout rules, stress proof by red rate |
| SP-63 | Superpowers `find-polluter` (MIT) | Find the test that pollutes another | Rewritten as a Node script with bisection, reset command, run bound, JSON and exit codes |
| SP-65 | Superpowers (MIT) | Parallel dispatch for independent problems | Optional read-only parallel investigators in the challenger prompt |
| AO-48 | Addy Osmani `agent-skills` (MIT) | Independent reproduction-test subagent | `reproduction-test-writer.md` with inline fallback |
| AO-49 | Addy Osmani (MIT) | Stop the line; reproduce → localise → reduce → fix → guard → verify | Step 0 stop-the-line; guard = defense in depth; verify = DoD with fingerprint |
| AO-50 | Addy Osmani (MIT) | Error-specific triage trees | `triage-trees.md` per failure kind |
| AO-51 | Addy Osmani (MIT) | Error and tool output as untrusted data | Step 0 rule and anti-rationalization row |
| AO-107 | Addy Osmani (MIT) | Competing-hypothesis investigation | Challenger pass attacking the ranked list |
| MP-58, MP-59, MP-60 | Matt Pocock `skills` (MIT) | Feedback loop first; ten constructions; tighten; raise flake rate; completion checklist | Step 1 red-loop gate with thresholds and a `NO RED LOOP` → `NEEDS_CONTEXT` stop |
| MP-61 | Matt Pocock (MIT) | Reproduce and minimise to load-bearing elements | Step 2 minimisation |
| MP-62 | Matt Pocock (MIT) | 3–5 ranked falsifiable hypotheses shown to the user | Step 4, with categories that drive root-cause routing |
| MP-63 | Matt Pocock (MIT) | One variable per probe; tagged debug logs | Step 5 probes; `[DEBUG-xxxx]` tags with a grep cleanup |
| MP-64 | Matt Pocock (MIT) | Regression test only at a correct seam; missing seam is a finding | Step 6.5 `missing seam` → `DONE_WITH_CONCERNS` |
| MP-65 | Matt Pocock (MIT) | Cleanup checklist; hypothesis in the commit | Step 8 and the commit format in `escalation-report.md` |
| MP-66 | Matt Pocock (MIT) | Redaction discipline | SET/UNSET for secrets in probes, loop records and reports |
| MP-67 | Matt Pocock (MIT) | Human-in-the-loop reproduction script | `hitl-reproduction-template.md`, rewritten with a checklist fallback |
| BM-02 | BMad Method (MIT) | Explicit halt conditions | Stop reports and halt reason `loop-bound` |
| BM-33 | BMad Method (MIT) | Root-cause routing with loopbacks | Cause categories routed per `loops.md` §2 (B6 for spec/design/plan) |
| BM-54 | BMad Method (MIT) | Bug ticket shape with "no change needed, with proof" | Bug intake shape in `triage-trees.md` §7 |

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-24 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | development |
| Tags | agentic-sdlc, debugging, root-cause, regression-test, flaky-tests, test-pollution |
| Risk | safe |
