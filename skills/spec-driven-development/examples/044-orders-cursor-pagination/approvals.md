# Approval register — 044-orders-cursor-pagination

<!--
Example (synthetic). skills/agentic-sdlc/references/governance.md §3. One row per request, appended when
the request is sent and completed in the later turn that answers it. Times are UTC. R1/R2 approved
rev 1; the rev 2 edit changed the spec hash, which voided both, so R3/R4 asked again.
-->

| Req | Sign-off | Artifact | Rev | Requested at | Asked role | Answered at | Exact words | Record |
|---|---|---|---|---|---|---|---|---|
| R1 | Specify + Design (combined) | spec.md | 1 | 2026-11-20 09:40 | Product Owner | 2026-11-20 16:05 | "Yes, approved: spec rev 1 and plan rev 1." | spec.md ## Approvals, row 1 |
| R2 | Specify + Design (combined) | plan.md | 1 | 2026-11-20 09:40 | Tech Lead | 2026-11-20 16:20 | "Approved, go." | plan.md ## Approvals, row 1 |
| R3 | Specify + Design (combined) | spec.md | 2 | 2026-11-22 08:55 | Product Owner | 2026-11-22 11:30 | "Approved — rev 2 with the 200 limit and has_more; plan rev 2 too." | spec.md ## Approvals, row 2 |
| R4 | Specify + Design (combined) | plan.md | 2 | 2026-11-22 08:55 | Tech Lead | 2026-11-22 11:45 | "Yes, plan rev 2 approved." | plan.md ## Approvals, row 2 |

## Request R3/R4 as sent (2026-11-22 08:55)

> Product Owner and Tech Lead: spec 044 changed after approval, so the rev 1 sign-offs are void (hash cc0e4f9de1dc → e7cd774a2bba).
> - `spec.md` rev 2: see `### Rev 2 delta` — changed AC-2 (limit 200) and AC-5 (p95 ≤ 600 ms at 200 rows); retired AC-6 (`total_count`); added AC-7 (`has_more`); must not change AC-3, AC-4 and the response envelope.
> - `spec-lint` exit 0, 0 warnings; critique fresh-context 12/12, 1 fixed, 0 open; threat-model.md rev 2 and ux.md rev 2 updated.
> - `plan.md` rev 2: T-2 and T-4 reopened, T-5 dropped (4 tasks); `plan-graph` exit 0.
> - Residual risk: partner migration pace unknown until the sunset date.
>
> Product Owner: approve spec rev 2 as the build baseline? Tech Lead: approve plan rev 2? Reply "yes" or list changes.

The agent ended its turn after this message; Build stayed paused at the last green test run of T-3.
