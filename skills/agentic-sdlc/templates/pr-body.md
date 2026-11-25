<!--
Agentic SDLC — pull request body. Rules: references/verification.md (Verification, Trace),
references/review.md (Review triage), references/governance.md (Waivers).
The Developer fills Summary and its own Verification rows when opening the PR.
The Reviewer re-runs every command and fills Verification (by: Reviewer), Trace, Review triage and Review guide.
Delete these comments; keep every heading. A section with nothing to report says "none" — never leave it blank.
Without a PR host, this file is committed as specs/NNN-slug/review.md (Quick: docs/reviews/<issue>.md) with the same sections.
Review records are excluded from the fingerprint, so committing one does not stale the evidence it cites.
-->

**Spec:** `specs/<NNN-slug>/spec.md` rev <N> · sha256 `<12 hex>` · **Plan:** rev <N> · sha256 `<12 hex>`
**Path:** <Quick | Standard | Full> · S=<n> · R=<n> (<triggers>) · **Enforcement:** <branch-protection | prompt-only>
**Base:** `<base branch>` @ `<sha>` · **Head:** `<sha>` · **Current fingerprint:** `<12 hex>`

## Summary

<2–5 lines: what changed and why, in terms of AC-n. Testimony only; the Reviewer verifies it.>

## Verification

DoD (`sdlc-dod`) and acceptance criteria are separate rows. A row counts only with `exit = 0` and `fingerprint = current fingerprint`; anything else is stale → re-run.

| ID | Test | Command | Exit | Fingerprint | Time (ISO-8601) | By |
|---|---|---|---|---|---|---|
| DoD:lint | — | `<command>` | <0> | `<12 hex>` | <time> | <Reviewer \| Developer \| self-review> |
| DoD:typecheck | — | `<command>` | <0 \| n/a — reason> | `<12 hex>` | <time> | <by> |
| DoD:test | — | `<command>` | <0> | `<12 hex>` | <time> | <by> |
| DoD:coverage | — | `<command>` | <0 (measured ≥ coverage_min)> | `<12 hex>` | <time> | <by> |
| AC-1 | `<test id>` <test name> | `<command>` | <0> | `<12 hex>` | <time> | <by> |
| Docs | <pages changed, or n/a — no user-visible change> | `<docs build + link check>` | <0 or n/a> | `<12 hex>` | <time> | <Tech Writer or Developer> |

### CANNOT_VERIFY

| AC | Critical | Reason | Checked instead | Verifier (role, person) | When (≤ 14 days after release) | Waiver |
|---|---|---|---|---|---|---|
| <AC-n or "none"> | <yes \| no> | <reason> | <check> | <role, person> | <date or event> | <W-n \| n/a (not Critical)> |

### Loop ledger

Rows from `run-ledger render` (or kept by hand on Quick), `references/loops.md` §3. "none" when every task passed first time.

| Date | Task | Loop | Round | Failure signature | Cause | Tried | Result |
|---|---|---|---|---|---|---|---|
| <date or "none"> | <Tn \| PR> | <loop> | <n> | <signature> | <cause> | <tried> | <failed \| fixed \| escalated> |

<details><summary>Output excerpts (last ≤ 40 lines per command)</summary>

```text
$ <command>   # ID: <AC-n | DoD:key> · fingerprint <12 hex>
<output>
```

</details>

## Trace

Forward: every AC has ≥ 1 task and ≥ 1 fresh passing test. Backward: every task has an AC; every commit has a Tn (Quick: an AC-n); every cited AC ID exists in the spec.

| AC | Tasks | Commits | Tests | Verification rows | Status |
|---|---|---|---|---|---|
| AC-1 | <T1, T2> | `<sha>`, `<sha>` | `<test id>` | <AC-1 row> | <ok \| orphan: kind> |

**Orphans:** <none | kind · ID · resolution>

## Review triage

**Reviewed SHA:** `<sha>` · **Review round:** <n> of 3 · **Verdict:** <GO | NO-GO>

### Lenses

| Lens | Context | Checks performed | Findings raised | Status |
|---|---|---|---|---|
| L1 spec/tests | <fresh subagent \| self-review> | <list every check> | <n> | <ran \| lens not run: reason> |
| L2 correctness/design | <context> | <checks> | <n> | <status> |
| L3 security | <context \| n/a — Quick without risk trigger> | <checks from security.md §Review checklist> | <n> | <status> |
| L4 context-free (diff only) | <context \| n/a — Quick> | <checks> | <n> | <status> |
| explore (optional) | <Test Engineer charter \| n/a> | <charter areas, `test-strategy` exploratory charter> | <n> | <status> |

### Findings

Every merged finding has one row and one disposition. Only `confirmed` findings carry a severity. Critical is never deferred.

| ID | Lens | Verification | Sev | File:line | Cause | Finding | Disposition | Evidence |
|---|---|---|---|---|---|---|---|---|
| F-1 | <L2, L4> | <confirmed \| not reproduced \| declined to judge> | <Critical \| Important \| Minor \| —> | `<path:line-line>` | <spec \| design \| plan \| code \| test \| env> | <one line> | <fixed `<sha>` \| rejected: evidence \| deferred #issue (owner: words) \| closed \| to human> | <command output, spec text or code ref> |

### Rounds

| Round | Reviewed range | Lenses run | Findings checked | New findings | Verdict |
|---|---|---|---|---|---|
| 1 | `<base>..<sha>` | <L1–L4> | — | <F-1..F-n> | <GO \| NO-GO> |

**GO conditions** (all true, else NO-GO): fresh passing row for every AC or a waived CANNOT_VERIFY · no orphans · 0 open Critical (fixed, or rejected with a recorded human ruling) · every confirmed finding has a disposition (Important deferred only with owner acceptance) · every required lens ran or is waived.

## Review guide

For the human reviewer (engineer) who gives Test sign-off. Read in this order.

1. **Files, riskiest first:** <`path` — why it is risky (risk trigger, security, data, public interface)>
2. **Questions for the human (3–7):**
   - <question tied to a file, AC or declined-to-judge finding>
3. **CANNOT_VERIFY items:** <AC-n — who verifies, when | none>
4. **Self-review labels:** <section and lens marked self-review | none>
5. **Deferred findings and waivers:** <F-n → #issue, owner | W-n | none>

## Waivers

| ID | Kind (accept risk \| defer \| emergency) | Gate waived | Reason | Owner (≠ requester) | Expiry (≤ 30 days) | Follow-up issue |
|---|---|---|---|---|---|---|
| <W-n or "none"> | <kind> | <gate> | <reason> | <role, person> | <YYYY-MM-DD> | <#issue> |

## Test sign-off

Filled only after the human answers in a later turn (`references/governance.md` §2, step 6). "pending" until then.

| Gate | Decision (exact words) | Approver (role, person) | Date (ISO-8601) | Head SHA |
|---|---|---|---|---|
| Test | <"approved …" \| pending> | <human reviewer, person> | <time> | `<40-hex sha>` |
