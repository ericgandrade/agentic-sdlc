# Prompt — Hypothesis Challenger

Used in Step 4 of `SKILL.md`, after the ranked hypothesis list is written and before the first probe. A fresh context attacks the list: it looks for hypotheses that cannot be falsified, probes that change more than one variable, a missing competing explanation, and a ranking that ignores the evidence. It is cheap (one pass) and protects the 3-refuted-hypotheses budget of the debug loop. Use it on every Standard and Full task, and on Quick tasks when the first probe would cost more than 10 minutes or touch shared infrastructure.

**No subagents on the platform:** run this prompt yourself in a fresh pass after clearing working notes — start a section headed `--- Hypothesis challenge pass ---`, load only the inputs below, answer every check before re-ranking, and label the result `self-review` in the task notes.

## Inputs (and nothing else)

- The red loop record (command, symptom, determinism, speed).
- The minimal case and the trace so far (`references/root-cause-tracing.md` chain lines).
- The evidence list: what changed (diff stat, dependency changes), triage tree branch taken, pattern differences found in Step 3.
- The ranked hypothesis list in the format of `references/escalation-report.md` §1.
- The ledger rows of earlier debug rounds on this task (refuted hypotheses and their observations).

Never pass: the Developer's preferred fix or any draft code.

## Prompt

```text
Role: Adversarial reviewer of a debugging plan. Do not validate and do not summarise. Find problems, or state explicitly that none were found for a check.

Evidence: <red loop record, minimal case, trace, change list, earlier refuted rounds>
Ranked hypotheses: <H1..Hn with category, prediction, probe>

Checks (answer each with PASS or a specific problem):
1. Falsifiable: every hypothesis states a prediction of the form "if X is the cause, then changing Y makes the symptom disappear (or worse)". Flag any that is a vibe.
2. One variable: every probe changes exactly one thing and can be run with the red loop in under 10 minutes.
3. Discriminating: the probe for H1 gives a different observable result than it would under H2 and H3. Flag probes that every hypothesis predicts the same way.
4. Coverage: name up to 2 competing explanations the list misses (shared state, environment, data shape, ordering, concurrency, a wrong test, a contradictory AC), each with a prediction.
5. Ranking: does the order follow the evidence (recent change on the stack, triage branch, earlier refutations)? Propose a re-ranking with one reason per move.
6. Already refuted: flag any hypothesis that restates a refuted ledger row in other words.
7. Category: flag any hypothesis whose confirmation would make the cause spec, design or plan; those stop the debug loop (breaker B6) instead of leading to a fix.

Return:
- Status: DONE | NEEDS_CONTEXT
- One line per check: PASS or the problem
- The re-ranked list (3 to 5 entries), each with category, prediction and one-variable probe
```

## After the pass

The Developer keeps the final list at 3–5 entries, records the challenge in the task notes, and tests the top entry first. The challenger never runs probes and never edits code. When the platform supports parallel agents and a wrong fix would be expensive (data migration, public API, money), one investigator per hypothesis may run in parallel read-only; each returns evidence for or against its hypothesis, and the probes still run one at a time on the red loop.
