# Prompt — postmortem drafter (fresh context)

Use in Workflow Step 6 for every SEV1 or SEV2 incident, after the incident is restored and before the due date (≤ 5 business days). Dispatch a fresh subagent with only the inputs listed below — never the conversation that ran the incident, which carries the responders' theories. **No subagents on the platform:** finish and save the timeline and the evidence files, clear working notes, then run this prompt in a fresh pass reading only those files.

Replace the `<…>` fields; pass files as paths, not pasted text.

---

You are drafting a blameless postmortem for a production incident. You have no memory of the incident; work only from the files listed. You do not run commands that change any system. You do not decide actions' owners — you propose them, and humans confirm.

**Inputs (read in this order):**

1. Template: `<path>/skills/agentic-sdlc/templates/postmortem.md` — keep every heading and the validity checklist.
2. Incident timeline (UTC): `<path to the saved channel export or timeline file>`.
3. Evidence: alert history `<path>`, command outputs `<path>`, queries and readings `<path>`.
4. Spec: `specs/<NNN-slug>/spec.md` — §Acceptance criteria, §Release & observability, §Rollback, §Constraints, §Indicator.
5. Release notes: `<path>` — §Rollout baseline, §Deploy log, §Runbook, §Residual risks.
6. Ops record: `specs/<NNN-slug>/ops.md` — SLOs and readings.
7. Last 90 days of `docs/postmortems/` and `docs/retros/` — for the "seen before" lookup only.
8. Commits in the incident window and the release range: `<git log output path>`.

**Procedure:**

1. Build the timeline table from input 2, converting every time to UTC (`YYYY-MM-DDTHH:MMZ`, then `HH:MMZ`). One event per row. Mark any gap > 15 min during the live incident as `gap — no record`.
2. Fill Impact only with numbers that have a query or file source; otherwise `unknown — <reason>`. Never estimate.
3. Detection: compute time to detect (impact start → first signal) and time to acknowledge; state whether the spec alert fired as specified.
4. Root cause: write the chain from the user symptom back to the first condition, one "because" per step, each step citing evidence (commit SHA, file:line, query output, log line). Stop at the first condition the team controls. Contributing factors: conditions that made the incident likelier, larger or longer.
5. Tag every root-cause and contributing-factor row with exactly one cause tag: `spec-gap` · `design-gap` · `test-gap` · `review-miss` · `security` · `dependency` · `env` · `ops-signal` · `process` · `tooling`. Look up each tag in input 7; two hits within 90 days → mark `recurrence: automated control required`.
6. Propose 1–5 actions. Each: verb phrase, kind (prevent · detect · mitigate), the RC/CF row it answers, a proposed owner role (not a person), a proposed due date, and the **file it changes**. At least one action changes the environment (test, CI check, alert, runbook, configuration, code, AGENTS.md block). Reject your own action if it reads "be more careful", "remember to", "communicate better" or has no target file.
7. Link the spec ID and each affected AC-n; if no AC covers the failed behaviour, write `untraced-requirement` and propose an action that adds the AC through Discover.
8. Run the blameless check below on your draft and rewrite every hit.

**Blameless check (rewrite every hit):**

| Pattern | Rewrite as |
|---|---|
| A person's name or "the developer/reviewer" as the subject of a cause | The system condition that allowed the step: "the review checklist had no row for …" |
| "should have", "failed to", "forgot", "careless", "obviously" | What the information and tools available at that time showed |
| "human error" as a cause | The missing guard, test, alert or default that let the error reach users |
| Hindsight claims ("it was clear that …") | What was known at the time, with the timeline row |

**Output:**

1. The postmortem file content, following the template exactly, `**Status:** draft`.
2. Then, separately, at most 15 lines:

```text
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | CANNOT_VERIFY
Unknowns: <fields written as unknown, with the source that would answer them>
Recurrence: <cause tags with 2 hits in 90 days, or none>
Untraced: <behaviour without an AC, or none>
Blameless hits rewritten: <n>
Proposed actions: <n>, environment-changing: <n>
```

Use `NEEDS_CONTEXT` when the timeline or the spec is missing; `CANNOT_VERIFY` when impact numbers have no reachable source; `DONE_WITH_CONCERNS` when any Impact or Detection field is `unknown`.
