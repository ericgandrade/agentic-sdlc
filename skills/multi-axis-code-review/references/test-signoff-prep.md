# Test Sign-off Preparation

Load in Step 10 of `../SKILL.md`, only after a GO verdict. Contract: `../../agentic-sdlc/references/governance.md` §1 (sign-off definition), §5 (approval depth), §6 (waivers); `../../agentic-sdlc/templates/pr-body.md` §Review guide. The Test sign-off is the approving PR review by a human reviewer (an engineer who is not the PR author). Agents prepare it; they never give it.

## 1. Pre-request check

All must hold; any miss → no request, fix the record first.

- [ ] Verdict GO recorded in the Rounds table with the head SHA it was reached on, and `git rev-parse HEAD` equals that SHA.
- [ ] Every Findings row has a disposition; no `to human` item is missing from the questions; every Critical is `fixed` or carries a recorded ruling.
- [ ] Every lens row lists its checks performed, or reads `lens not run` with a waiver ID.
- [ ] Verification rows fresh on the head fingerprint (`evidence check` exit 0); each `CANNOT_VERIFY` has a reason, a verifier and a date.
- [ ] Waivers valid: owner ≠ requester (except §6.3), expiry within the kind's maximum, follow-up issue present. A Critical is never under `accept-risk` or `defer`.
- [ ] `node skills/agentic-sdlc/scripts/spec-lint.mjs --check-approval specs/NNN-slug/spec.md` exit 0 on Standard/Full (manual: the Approvals hash equals the current spec hash).

## 2. Files, riskiest first

Order files by the first rule that matches; ties by lines changed, largest first. One line each: path — reason.

1. Files carrying a confirmed Critical or Important finding, or a rejected Critical ruling.
2. Files touching a risk trigger (`../../agentic-sdlc/references/paths.md` §2): auth, personal/health data, money, public API, schema/migration, irreversible, regulated.
3. Files in the L3 attack surface: new endpoints, input parsing, queries, file and network access, dependency manifests.
4. Files with `declined to judge` or `self-review` items.
5. Test and threshold files changed by the fix rounds (weakened-bar candidates that were cleared).
6. Everything else; generated files and lockfiles last, named but not described.

Example: `server/src/routes/export.ts — money + public API; F-1 (Critical, fixed f66b528), F-2 (Important, fixed 0a7c639)`.

## 3. Questions (3–7)

Each question asks for a judgement only a human with domain, product or production knowledge can give, and points at a file, AC or F-n.

Rules:
- One question per `declined to judge` finding, always.
- Ask about what the evidence cannot show: business rules, data in production, operational load, user-facing wording, legal limits.
- Closed or choice form, answerable in one line: "Is 50,000 rows the right hard cap for the largest customer (AC-4)? Current largest export: unknown to the agent."
- Never ask "does this look good" or "any concerns"; never ask what a command could answer.
- Fewer than 3 real questions → fill with the riskiest file's assumptions (stated as a question about the assumption). More than 7 → keep the 7 tied to the highest-severity items and list the rest under item 1 reasons.

## 4. Remaining items

- **CANNOT_VERIFY:** `AC-6 — email delivery in staging; verifier: QA lead M. Silva; by 2026-11-28` or `none`.
- **Self-review labels:** every lens row and finding marked `self-review`, by section; on the Full path the second human reviewer records their own check of each.
- **Deferred findings and waivers:** `F-6 → #422 (Minor)`, `F-3 → #419, owner: "accept until 2026-12-08"`, `W1`. Residual risk is everything in this list plus every CANNOT_VERIFY item.

## 5. The request

One message, posted as a PR comment (or the review record `specs/NNN-slug/review.md` without a PR host):

```text
Test sign-off requested — Human reviewer (engineer, not the author)
PR: #57 · specs/014-invoice-export · path Standard
Head SHA: 1b8d74a (review binds to this SHA)
Verdict: GO after round 2 of 3 · lenses L1–L4 ran · 0 open Critical
Evidence reviewed: Verification (fingerprint 3fa9…), Trace (0 orphans), Review triage F-1..F-7
Residual risks: F-6 deferred #422 (Minor) · AC-6 CANNOT_VERIFY (M. Silva, 2026-11-28)
Read first: Review guide items 1–2 (3 files, 4 questions)
```

Approval depth (`governance.md` §5):

| Path | Test sign-off |
|---|---|
| Quick | 1 human reviewer |
| Standard | 1 human reviewer |
| Full | 2 human reviewers, at least 1 not involved in Design |

On the Full path name both requested reviewers and which one is outside Design. One-person team: the sign-off is a waiver under `governance.md` §6.3 — owner `self · 1-person team`, decided in a later session at least 12 hours after the request, PR banner `self-approved under waiver W<n>`; the request says so explicitly.

## 6. After the request

- **End the turn.** No agent approves, merges or marks the review as given.
- **A push after the request** makes it stale: the approval binds to the head SHA, and branch protection dismisses stale reviews. Run a scoped re-review on the delta (`../SKILL.md` Step 9), update the Rounds table, then request again with the new SHA.
- **The human answers a question with a new requirement** → that is a spec change: route `spec` (`triage-and-routing.md` §4), not a code fix in review.
- **The human finds a defect** → it enters the Findings table as F-n with lens `human`, is verified and rated like any finding, and counts toward the same 3-round bound.
- **Recorded:** the reviewer's name, the head SHA and the date in the PR approval; the Rounds row for the final round lists `Test sign-off: <name> at <sha>`.
