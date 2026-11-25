**Issue:** `docs/issues/0001-slugify-trailing-dash.md` (AC-1) · **Spec:** n/a — Quick (issue holds the acceptance test) · **Plan:** n/a — Quick
**Path:** Quick · S=3 · R=0 · **Enforcement:** prompt-only — approvals are not system-enforced on this repository
**Base:** `main` @ `6d319c1d8442` · **Head:** `5385f3b631e3` · **Current fingerprint:** `289ec2f08143`

## Summary

`slugify` now strips trailing separators as well as leading ones, so `slugify('Hello World!')` returns `hello-world` (AC-1). One-line regex change in `src/slugify.js`; two AC-1 tests added. Testimony only; the Reviewer verified it below.

## Verification

DoD (`sdlc-dod`) and acceptance criteria are separate rows. A row counts only with `exit = 0` and `fingerprint = current fingerprint`; anything else is stale → re-run.

| ID | Test | Command | Exit | Fingerprint | Time (ISO-8601) | By |
|---|---|---|---|---|---|---|
| DoD:lint | — | `npm run lint --silent` | 0 | `289ec2f08143` | 2026-11-24T23:59:25Z | self-review (Reviewer pass) |
| DoD:typecheck | — | n/a | n/a — plain JavaScript (ES modules, no type checker) | `289ec2f08143` | 2026-11-24T23:59:25Z | self-review (Reviewer pass) |
| DoD:test | — | `npm test --silent` | 0 | `289ec2f08143` | 2026-11-24T23:59:25Z | self-review (Reviewer pass) |
| DoD:coverage | — | `npm run coverage --silent` | 0 (100.0 ≥ 100.0) | `289ec2f08143` | 2026-11-24T23:59:26Z | self-review (Reviewer pass) |
| AC-1 | `test/slugify.test.js` AC-1 slugify strips trailing dashes from punctuation at the end | `node --test --test-name-pattern="AC-1" "test/**/*.test.js"` | 0 | `289ec2f08143` | 2026-11-24T23:59:26Z | self-review (Reviewer pass) |
| AC-1 | `test/slugify.test.js` AC-1 slugify strips runs of leading and trailing separators | `node --test --test-name-pattern="AC-1" "test/**/*.test.js"` | 0 | `289ec2f08143` | 2026-11-24T23:59:26Z | self-review (Reviewer pass) |
| Docs | n/a — no user-visible docs page (README has no API section) | n/a | n/a | `289ec2f08143` | 2026-11-24T23:59:26Z | Developer |

Developer rows (round 1, fingerprint `fe6c7e0c1e4f`, commit `ad6ec36`) were green but are now stale (testimony; superseded by the Reviewer re-run above).

Red output recorded before the fix (Developer, commit `ef677f5`, test added uncommitted):

```text
not ok 1 - AC-1 slugify strips trailing dashes from punctuation at the end
    Expected values to be strictly equal:
    + 'hello-world-'
    - 'hello-world'
  code: 'ERR_ASSERTION'
```

### CANNOT_VERIFY

| AC | Critical | Reason | Checked instead | Verifier (role, person) | When (≤ 14 days after release) | Waiver |
|---|---|---|---|---|---|---|
| none | — | — | — | — | — | — |

### Loop ledger

Kept by hand (Quick: `run-ledger start` requires `--plan`).

| Date | Task | Loop | Round | Failure signature | Cause | Tried | Result |
|---|---|---|---|---|---|---|---|
| 2026-11-24 | PR | review-fix | 1 | F-1 missing edge test for runs of separators | test | add `AC-1 … runs of leading and trailing separators`, proven red at base | fixed |

<details><summary>Output excerpts (last ≤ 40 lines per command)</summary>

```text
$ npm run lint --silent   # ID: DoD:lint · fingerprint 289ec2f08143
lint: 5 files checked, 0 failed
$ npm test --silent   # ID: DoD:test · fingerprint 289ec2f08143
# tests 5
# pass 5
# fail 0
$ npm run coverage --silent   # ID: DoD:coverage · fingerprint 289ec2f08143
coverage: lines 15/15 = 100%
$ node --test --test-name-pattern="AC-1" "test/**/*.test.js"   # ID: AC-1 · fingerprint 289ec2f08143
ok 1 - AC-1 slugify strips trailing dashes from punctuation at the end
ok 2 - AC-1 slugify strips runs of leading and trailing separators
# pass 2
# fail 0
```

</details>

## Trace

Forward: every AC has ≥ 1 task and ≥ 1 fresh passing test. Backward: every task has an AC; every commit has a Tn (Quick: an AC-n); every cited AC ID exists in the spec.

| AC | Tasks | Commits | Tests | Verification rows | Status |
|---|---|---|---|---|---|
| AC-1 | n/a — Quick | `ef677f5`, `ad6ec36`, `5385f3b` | `AC-1 slugify strips trailing dashes…`, `AC-1 slugify strips runs…` | AC-1 (2 rows) | ok |

**Orphans:** none (`git log --format='%h%x09%s%x09%(trailers:key=Refs,valueonly,separator=%x20)' main..HEAD` → every commit carries `AC-1`).

## Review triage

**Reviewed SHA:** `5385f3b631e3` · **Review round:** 2 of 3 · **Verdict:** GO

### Lenses

| Lens | Context | Checks performed | Findings raised | Status |
|---|---|---|---|---|
| L1 spec/tests | self-review (separate labelled pass: issue + diff + re-run output only) | AC-1 implemented; no behaviour outside AC-1; each AC test asserts the stated outcome; negative/edge test for the input AC; tdd.md §3 A1–A14 on both new tests; Trace orphans | 1 (round 1) | ran |
| L2 correctness/design | self-review | Edge cases (empty string, only punctuation → `''`, runs of separators, accents); signature unchanged; no new abstraction; error path (`TypeError`) unchanged; DoD output re-read for warnings | 1 | ran |
| L3 security | n/a — Quick without risk trigger | — | 0 | n/a |
| L4 context-free (diff only) | n/a — Quick | — | 0 | n/a |
| explore (optional) | n/a | — | 0 | n/a |

### Findings

| ID | Lens | Verification | Sev | File:line | Cause | Finding | Disposition | Evidence |
|---|---|---|---|---|---|---|---|---|
| F-1 | L1 | confirmed | Important | `test/slugify.test.js:17-19` | test | AC-1 handles input but had no edge test for runs of leading/trailing separators | fixed `5385f3b` | new test red at base (`actual 'rock-roll-'`), green at head |
| F-2 | L2 | declined to judge | — | `src/slugify.js:13` | spec | Input made only of separators (`'!!!'`) now returns `''`; whether an empty slug is acceptable is a product decision | to human | `node -e` → `""` |

### Rounds

| Round | Reviewed range | Lenses run | Findings checked | New findings | Verdict |
|---|---|---|---|---|---|
| 1 | `6d319c1..ad6ec36` | L1, L2 | — | F-1, F-2 | NO-GO |
| 2 | `6d319c1..5385f3b` | L1, L2 | F-1 fixed, F-2 to human | none | GO |

**GO conditions** (all true, else NO-GO): fresh passing row for every AC or a waived CANNOT_VERIFY · no orphans · 0 open Critical (fixed, or rejected with a recorded human ruling) · every confirmed finding has a disposition (Important deferred only with owner acceptance) · every required lens ran or is waived.

## Review guide

For the human reviewer (engineer) who gives Test sign-off. Read in this order.

1. **Files, riskiest first:** `src/slugify.js` — exported function, return value changes for inputs ending in separators (callers that relied on the trailing `-` would see different slugs).
2. **Questions for the human (3–7):**
   - F-2: is `slugify('!!!') === ''` acceptable, or should it throw?
   - Is a changed return value for existing inputs acceptable without a major version bump (public-API trigger judged absent)?
   - Are stored slugs generated by older versions affected (no migration in scope)?
3. **CANNOT_VERIFY items:** none
4. **Self-review labels:** Verification (all rows), Lenses L1 and L2 — single agent played Developer and Reviewer
5. **Deferred findings and waivers:** none

## Waivers

| ID | Kind (accept risk \| defer \| emergency) | Gate waived | Reason | Owner (≠ requester) | Expiry (≤ 30 days) | Follow-up issue |
|---|---|---|---|---|---|---|
| none | — | — | — | — | — | — |

## Test sign-off

No PR host: the approving review is recorded here (format improvised — the method defines no Test sign-off row layout outside a PR host).

| Sign-off | Head SHA | Fingerprint | Date (UTC) | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|
| Test | `5385f3b631e3` | `289ec2f08143` | 2026-11-25 00:02 | Human reviewer (engineer) | dogfood-owner — SIMULATED | "yes, approved — empty slug for punctuation-only input is fine, no major bump needed" | Verification, Trace, Review triage, Review guide | stored slugs from older versions keep trailing `-` | approved |
