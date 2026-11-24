# operations-and-incidents

Operate-stage skill of the **Agentic SDLC**, used by the SRE agent. It opens the per-item ops record `specs/NNN-slug/ops.md`, derives SLIs, SLO floors and error budgets from the approved spec (never inventing new thresholds), watches each release through its rollout stages and its first-week watch period, turns a fired alert into a classified incident (SEV1–SEV3, plus SEV4 for non-incidents) with a UTC timeline and status updates, drafts a blameless postmortem with owned, file-changing actions, computes the four DORA delivery metrics by hand from git and the release history, and sends every lesson back to Discover as a `from-production` issue. The on-call engineer, a human, executes every state-changing production action; the agent only proposes the command.

## When to use

- A release was handed over to Operate, or a rollout stage needs an advance / hold / roll back reading.
- A spec alert fired, a user reported a failure, or an incident needs a severity, an owner, a timeline or a close decision.
- A SEV1 or SEV2 postmortem is due or must be checked for blame and unowned actions.
- The first indicator reading is due (release + 7 days), an alert is noisy, or a runbook is stale.
- A retro needs production facts and DORA metrics.

Not for: defining observability for a new change (`spec-driven-development`), release notes and the Release sign-off (`shipping-and-handover`), pipeline gates (`deployment-pipeline`), root-cause debugging in code (`systematic-debugging`), or running the retro meeting (`retrospective`).

## What is included

- `SKILL.md` — modes, Steps 0–9 (discovery, ops record, SLOs, watch period, alert triage, incident response, postmortem, production intake, DORA metrics, report), anti-rationalization table, critical rules, five examples
- `references/slo-from-spec.md` — SLI/SLO/error-budget derivation from the spec, budget states, CSV export worked example
- `references/alerting-and-runbooks.md` — symptom vs cause alerts, two urgencies, A1–A8 alert review, alert trend rule, runbook stub per alert
- `references/incident-response.md` — severity table SEV1–SEV4, roles (incident commander, on-call engineer, communications, SRE agent), first three actions, hotfix path with emergency waiver, UTC timeline, update cadence and format, shift handover, restored vs closed
- `references/dora-metrics.md` — deployment frequency, lead time, change failure rate, time to restore: definitions, git commands, worked computation, honesty rules
- `prompts/postmortem-drafter.md` — fresh-context postmortem drafter with blameless check and cause tags
- Uses from `agentic-sdlc`: `templates/ops-record.md`, `templates/postmortem.md`, `templates/retro.md`, `references/release-ops.md`, `references/retrospective.md`, `scripts/spec-lint.mjs`
- `evals/evals.json` — 4 scenarios (first reading, live incident, pressure to self-execute and skip the postmortem, DORA metrics)
- `evals/trigger-eval.json` — 16 trigger queries (9 positive, 7 negative)

## Typical invocation

- "The export release closed — do the 7-day reading and open the ops record."
- "`reports-export-error-rate` just fired at 6%. What do we do?"
- "Draft the postmortem for yesterday's SEV2."
- "This alert pages every night and clears by itself."
- "Get the DORA numbers for Monday's retro."

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| AO-97 | Addy Osmani agent-skills (MIT) | Symptom-based alerting, two urgencies, every alert linked to a short runbook | Alerts stay in the spec; Operate reviews them with an A1–A8 checklist and proposes changes via `from-production` issues; runbook stub follows the module's five lines + `Last verified` |
| AO-94 | Addy Osmani agent-skills (MIT) | Define "working" by the questions on-call will ask | Runbook test question "what do I run first, how do I know the rollback worked, whom do I call?" |
| AO-92 | Addy Osmani agent-skills (MIT) | Error-budget release policy by remaining budget | Budget states `healthy · low · exhausted · burning` reported as advice to the Product Owner and Tech Lead, never a gate the agent enforces |
| AO-89 | Addy Osmani agent-skills (MIT) | Staged rollout with advance / hold / roll back thresholds | Uses the module's stage table unchanged; "hold" defined as "advance condition not shown with a number" |
| AO-91 | Addy Osmani agent-skills (MIT) | Post-launch verification instead of nobody watching | Operate watch period: SLI readings at release closed + 24 h and release + 7 days, closed in `ops.md` |
| AO-104 | Addy Osmani agent-skills (MIT) | Metric honesty: never fabricate, label the source | Every reading carries query, window and UTC time; `not measured — no signal`; < 5 data points → counts only in DORA |
| SP-57 | Superpowers (MIT) | No fixes without root-cause investigation | Mitigate first in an incident, then hand off cause analysis to `systematic-debugging`; postmortem root cause needs evidence per step |
| SP-60 | Superpowers (MIT) | Backward tracing from symptom to original trigger | Postmortem root-cause chain from user symptom back to the first controllable condition, one "because" per step |
| SP-37 | Superpowers (MIT) | Status contract for delegated work | Postmortem drafter returns `DONE · DONE_WITH_CONCERNS · NEEDS_CONTEXT · CANNOT_VERIFY` in ≤ 15 lines |
| BM-84 | BMad Method (MIT) | A finding without a source is dropped | Impact numbers without a query → `unknown — <reason>`; postmortem rows cite commits, queries, log lines |
| BM-86 | BMad Method (MIT) | Two dispositions per finding: this instance and prevention | Postmortem actions typed prevent · detect · mitigate, each with a target file and an issue |
| MP-74 | Matt Pocock skills (MIT) | Lessons change the environment, not just the code | ≥ 1 postmortem action changes a test, CI check, alert, runbook, configuration or AGENTS.md block |
| MP-75 | Matt Pocock skills (MIT) | Mechanical problems become deterministic checks | Recurring cause tag (2 in 90 days) → automated control approved by a person other than the proposer |
| — | Google SRE practice (public books; paraphrased) | SLI/SLO/error budget, burn rate, incident command roles, blameless postmortem culture | SLO floor derived from the spec alert; incident commander is always a named human; blameless rewrite table |
| — | AWS AI-DLC Operation phase (public docs; paraphrased) | Operations as a phase that feeds the next cycle | Operate → Discover via `from-production` issues triaged within 2 business days |
| — | DORA research (public; paraphrased) | Four delivery metrics | Manual computation from git tags, deploy logs and postmortems until `metrics.mjs`† exists |

† Added in a later release of `agentic-sdlc`.

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-24 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | devops |
| Tags | agentic-sdlc, operations, incidents, sre, slo, postmortem, observability, dora-metrics, on-call |
| Risk | medium |
