# Approval register — 001-csv-export

<!--
Worked example (synthetic). references/governance.md §3. One row per approval request, appended
when the request is sent (Requested at) and completed in the later turn that answers it (Answered at,
Exact words). Times are UTC. The binding records stay in each artifact's ## Approvals section;
spec-lint --check-approval cross-checks the spec.md row against this register.
-->

| Req | Sign-off | Artifact | Rev | Requested at | Asked role | Answered at | Exact words | Record |
|---|---|---|---|---|---|---|---|---|
| R1 | Specify + Design (combined) | spec.md | 1 | 2026-11-23 10:05 | Product Owner | 2026-11-23 14:40 | "Yes — approved: spec rev 1 and plan rev 1 as presented." | spec.md ## Approvals, row 1 |
| R2 | Specify + Design (combined) | plan.md | 1 | 2026-11-23 10:05 | Tech Lead | 2026-11-23 15:10 | "Approved. Plan rev 1, five tasks, go." | plan.md ## Approvals, row 1 |

## Request R1/R2 as sent (2026-11-23 10:05)

> Product Owner and Tech Lead: combined review (Standard path, plan has 5 tasks).
> - `specs/001-csv-export/spec.md` rev 1, hash in spec.md ## Approvals; `spec-lint` exit 0, 0 warnings except the threat-model notice for the money trigger.
> - `specs/001-csv-export/plan.md` rev 1, built on that spec hash; `plan-graph` exit 0.
> - Critique: fresh-context, 12/12, 3 findings fixed, 0 open; Product Manager critique: 0 open.
> - `ux.md` rev 1 (UX Designer): 6 states, 4 accessibility requirements; every state mapped to an AC or a UI kit pattern.
> - Residual risk: the export error alert is untested until the staging test alert (release checklist).
>
> Product Owner: approve spec rev 1 as the build baseline? Tech Lead: approve plan rev 1? Reply "yes" or list changes.

The agent ended its turn after this message. Both replies arrived in later turns; their exact words are in the table.

## Test and Release sign-offs

Recorded at their stages: the Test sign-off as the human review on the pull request (`pr-body.md` §Verification lists the head commit), the Release sign-off in `release-notes.md` § Approval. Each is appended here as R3 and R4 when requested.
