# Ralph Loop study: should the Agentic SDLC add an unattended outer loop?

**Date:** 2026-11-25 · **Question:** should v3.1 add a Ralph-style loop, so a run continues across fresh agent sessions without a person pressing Enter, and how much would it add to the method's score?

## Answer

**Yes, in v3.1, but only together with enforced authority limits.**

- **Product value: high.** The method already keeps all run state on disk and stops itself safely. What it lacks is the component that starts the next agent session. BMad shipped exactly that in July 2026, so this is now table stakes for unattended work.
- **Score value: small on its own.** A loop driver alone leaves C8 (autonomous execution safety) at level 4: **+0.0**. Moving C8 to level 5 also needs authority limits enforced outside the prompt, plus a check and a test that prove it: **+1.2 baseline, +2.2 under the autonomous-scale profile**.
- **Higher score return elsewhere.** The `approval-check` and `trace-check` scripts lift C10 and C9 to 5: **+3.9 baseline, +7.4 regulated**.

## 1. What the Ralph Loop is

Geoffrey Huntley described it in July 2025 as `while :; do cat PROMPT.md | claude-code ; done` ([ghuntley.com/ralph](https://ghuntley.com/ralph/); follow-up in January 2026: [ghuntley.com/loop](https://ghuntley.com/loop/)).

**How it works:**
- Each iteration starts a fresh context and does one task.
- State lives in files (a prioritized TODO list, the specs and the agent instructions).
- The loop continues until the list is empty.

**What it solves:** context exhaustion in long sessions, and the need for a person to keep the agent going.

**Known failure modes** ([ghuntley.com/ralph](https://ghuntley.com/ralph/)):
- **Drift and duplication.** For example, a missed search makes the agent re-implement code that already exists.
- **Low-quality work slips through:** placeholder code, and bad specs that waste many iterations.
- **Broken builds** that the loop cannot repair alone.
- **No formal stop condition.**
- **Cost.** About US$10 per hour, reported by [The Register](https://www.theregister.com/2026/01/27/ralph_wiggum_claude_loops/); this is a secondary source.

**Recommended guardrails:**
- Back-pressure from tests and type checks.
- Explicit rules in the prompt.
- Commit on green.
- A recovery procedure.
- An iteration cap.

## 2. Who implements it

| Implementation | What it does | How it stops | Human control |
|---|---|---|---|
| **BMad: `bmad-loop`**, shipped as a module in BMAD-METHOD v6.10.0 (2026-07-03); open beta v0.13.2 ([CHANGELOG](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/CHANGELOG.md), [bmad-loop](https://github.com/bmad-code-org/bmad-loop)) | A Python orchestrator picks each story, starts a fresh agent session (tmux) in an isolated worktree, runs verification, optionally a fresh review session, then commits | Only on a completion event or the session ending, "never on model prose"; attempt caps, `max_review_cycles` (3), token budgets, stall timeouts | A critical escalation pauses the run and writes an `ATTENTION` file (`bmad-loop resolve`); human-only work waits for `bmad-loop confirm`; configurable gates; never pushes ([unattended builds](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/skills/method/bmod-method/help/unattended-builds.md)) |
| **Anthropic `ralph-loop` plugin** ([claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop)) | A Stop hook blocks session exit and feeds the same prompt back | `--max-iterations` (unlimited by default) or an exact "completion promise" string | `/cancel-ralph`. It runs **inside one session**, so the context is not fresh per iteration, and one string cannot tell success from blocked |
| **Spec Kit community extension** ([spec-kit-ralph](https://github.com/Rubiss-Projects/spec-kit-ralph)) | Fresh agent per iteration, with memory, tasks and progress files | Complete with a clean repository, `max_iterations`, 3 iterations without progress, or 3 agent failures | Refuses to start on a dirty repository |
| **Kiro community script** ([ralph-loop-kiro-specs](https://github.com/mreferre/ralph-loop-kiro-specs)) | Runs `kiro-cli` non-interactively in a loop | Required max iterations; `<promise>COMPLETE</promise>`; a task is marked failed after 3 attempts | Optional manual mode that waits for Enter |

No implementation was found in Superpowers, AWS AI-DLC or OpenSpec (code search of each default branch, November 2026).

One source conflict, low confidence: the bmad-loop README says it reads the v7 ticket tree, while BMad's unattended-builds page says it does not dispatch from it yet.

## 3. What the Agentic SDLC already has

Most of what a safe loop needs is built and tested:

| Need | Already in the method |
|---|---|
| Gate before unattended work | `run-ledger start --mode unattended` refuses to start without valid, hash-bound Specify and Design sign-offs (`references/autonomous.md` §1) |
| Isolation | A worktree on an `sdlc/*` branch; `preflight` at start and at every resume |
| Stop conditions | 10 halt reasons; budgets of 15 tasks, 5 rounds per task, 4 active hours and 300 turns; authority limits |
| State on disk | Append-only run ledger, `resume --ack` after a halt, `result.json` with DONE, BLOCKED or NEEDS_HUMAN |
| A machine-readable status | `run-ledger status --json`: `state` (running, halted, finished), `next`, `preflightFresh`, `budget.over`, `result` |
| Bounded loops | red-green 3, build-test 5, review-fix 3, debug 3, anti-thrash breaker |
| Fresh context per task | Only when subagents are dispatched; an inline unattended run builds up context in one session |

The machine-readable result is already stronger than a single "completion promise", because it separates three outcomes.

## 4. What is missing

1. **An outer driver**, `scripts/run-driver.mjs` (Node ≥ 18, no dependencies). It starts one fresh, headless agent session per iteration and waits for it to exit. Then it reads `run-ledger status --json` and decides:
   - `running` and no budget exceeded → start the next session.
   - `halted`, or `finished` with NEEDS_HUMAN → stop and notify.
   - `finished` with DONE or BLOCKED → stop.
   - It never acknowledges a halt by itself; that stays with a person.
2. **An iteration prompt**, `templates/iteration-prompt.md`. It carries the run ID and the sequence `resume` → `preflight` → `check` → exactly one task from the frontier → `task done` → commit → exit, plus the halt rule and the authority limits.
3. **Completion read from the scripts, never from model text.** This is the same rule bmad-loop uses.
4. **A stall timeout.** A session that writes no ledger event within N minutes is ended and counted as a failure.
5. **Measured counters.** Turns and tokens come from the agent CLI's own output rather than from the agent's self-report, which the round-2 scorecard lists as a limitation.
6. **Enforced authority limits.** This is what moves C8. Each session is launched with tool permissions or a pre-tool hook that blocks push, merge, tag and deploy. `preflight` gets a check that the guard is active, and a `node --test` case shows a blocked push being refused and a relaunch resuming correctly. The exact CLI flags per platform still need to be verified in the spike; start with Claude Code.

A Stop or SessionEnd hook may tell the driver that a session ended, but it must not keep the loop going inside one session. That would bring back the context build-up that C13 credits the method for avoiding.

## 5. Score impact

The levels come from the frozen methodology (§4). The weights are from §5.1 and §5.3.

**C8 level descriptors:**
- **Level 4:** level 3 plus authority limits, budget controls and a machine-readable result that separates done, blocked and needs-human. **The method is here today**, tied with AWS AI-DLC as the best benchmark.
- **Level 5:** level 4 plus "enforcement beyond prompts of the authority limits (hooks, permission settings, sandbox configuration or scripts that block disallowed actions) and a tested or scripted resume procedure." Resume is already scripted and tested. Both round-2 scorers named self-reported authority limits as the gap.
- **C6 (loops) and C13 (context) are already at 5.** The driver protects C13 in unattended runs, but there is no higher level to reach.

**Projected totals.** Each scenario changes only the listed criteria. The computation reproduces today's totals exactly in all five profiles:

| Scenario | Baseline | Equal | Startup | Regulated | Autonomous |
|---|---:|---:|---:|---:|---:|
| Today (v3.0.0) | 88.5 | 86.9 | 89.2 | 86.0 | 90.6 |
| Ralph driver alone (C8 stays 4) | 88.5 (+0.0) | 86.9 (+0.0) | 89.2 (+0.0) | 86.0 (+0.0) | 90.6 (+0.0) |
| Driver + enforced authority limits (C8 → 5) | 89.7 (+1.2) | 88.1 (+1.2) | 90.8 (+1.6) | 87.0 (+1.0) | 92.8 (+2.2) |
| `approval-check` in CI (C10 → 5) | 90.9 (+2.4) | 89.4 (+2.5) | 90.0 (+0.8) | 90.4 (+4.4) | 92.2 (+1.6) |
| `trace-check` in CI (C9 → 5) | 90.0 (+1.5) | 88.8 (+1.9) | 89.8 (+0.6) | 89.0 (+3.0) | 91.8 (+1.2) |
| Both checks (C9, C10 → 5) | 92.4 (+3.9) | 91.2 (+4.4) | 90.6 (+1.4) | 93.4 (+7.4) | 93.4 (+2.8) |
| Easier adoption (C1 → 5) | 89.7 (+1.2) | 88.1 (+1.2) | 91.6 (+2.4) | 86.6 (+0.6) | 91.4 (+0.8) |
| Versioned extension interface (C15 → 5) | 89.3 (+0.8) | 88.1 (+1.2) | 90.4 (+1.2) | 86.2 (+0.2) | 91.2 (+0.6) |
| All of the above | 95.6 (+7.1) | 95.0 (+8.1) | 95.8 (+6.6) | 95.2 (+9.2) | 97.0 (+6.4) |

These are projections, not scores. A level counts only when an independent re-score grants it, which the methodology already requires for the built method.

**Competitive note.** BMad's round-2 C8 card ("no worktree/sandbox found") predates bmad-loop's worktree isolation, so BMad's C8 may now be higher than scored. Adding the loop keeps parity on the capability that competitors are shipping now, even where the points are small.

## 6. Recommendation

1. Build the driver in v3.1 **with** enforced authority limits (item 6), never without them. The driver alone gives no points and adds cost and drift risk.
2. Ship it opt-in, Claude Code first: `run-driver --run <id> --max-iterations N --stall-min M`, which needs an unattended run that has already passed both sign-offs.
3. Put the `approval-check` and `trace-check` scripts first in the same release. They are the highest score return (+3.9 baseline) and they close the two criteria the README lists as discounted.
4. Re-score with new scorers after v3.1. Projected baseline with the loop and both checks: **93.6**.

Sources for sections 1–2: the URLs inline, read November 2026. Statements marked secondary or low confidence were not confirmed at a primary source.
