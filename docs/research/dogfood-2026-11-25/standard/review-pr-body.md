**Spec:** `specs/001-price-format/spec.md` rev 1 · sha256 `46743045b021` · **Plan:** rev 1 · sha256 `aad1222c3fd3`
**Path:** Standard · S=3 · R=1 (money) · **Enforcement:** prompt-only
**Base:** `main` @ `0fe81e1994c7` · **Head:** `a6eb040a7f64` · **Current fingerprint:** `754c1c280a5f`

## Summary

Adds `formatPrice(amountMinor, currency, locale)` (AC-1..AC-3), exported from `src/index.js` (AC-1), with RangeError guards for non-safe-integer amounts (AC-4) and malformed currency codes or locales (AC-5). Review round 1 found a money-precision defect for amounts near 2^53 (F-1) and a `-$0.00` output (F-2); both fixed in `a6eb040` by formatting from an exact decimal string. Testimony only; the Reviewer verified it below.

## Verification

DoD (`sdlc-dod`) and acceptance criteria are separate rows. A row counts only with `exit = 0` and `fingerprint = current fingerprint`; anything else is stale → re-run.

| ID | Test | Command | Exit | Fingerprint | Time (ISO-8601) | By |
|---|---|---|---|---|---|---|
| DoD:lint | — | `npm run lint --silent` | 0 | `754c1c280a5f` | 2026-11-25T00:08:00Z | Reviewer (self-review) |
| DoD:typecheck | — | n/a | n/a — plain JavaScript (ES modules, no type checker) | `754c1c280a5f` | 2026-11-25T00:08:00Z | Reviewer (self-review) |
| DoD:test | — | `npm test --silent` | 0 | `754c1c280a5f` | 2026-11-25T00:08:00Z | Reviewer (self-review) |
| DoD:coverage | — | `npm run coverage --silent` | 0 (100.0 ≥ 100.0) | `754c1c280a5f` | 2026-11-25T00:08:00Z | Reviewer (self-review) |
| AC-1 | AT-1a, AT-1b; `AC-1 formats 123456 USD cents…`, `AC-1 formats the largest safe integer…`, `AC-1 formats negative zero as zero`, `AC-1 formatPrice is exported…` | `node --test --test-name-pattern="AC-1 " "test/**/*.test.js"` | 0 | `754c1c280a5f` | 2026-11-25T00:08:00Z | Reviewer (self-review) |
| AC-2 | AT-2a; `AC-2 formats 123456 EUR cents in de-DE…` | `node --test --test-name-pattern="AC-2 " "test/**/*.test.js"` | 0 | `754c1c280a5f` | 2026-11-25T00:08:00Z | Reviewer (self-review) |
| AC-3 | AT-3a; `AC-3 formats 1234 JPY in en-US…` | `node --test --test-name-pattern="AC-3 " "test/**/*.test.js"` | 0 | `754c1c280a5f` | 2026-11-25T00:08:01Z | Reviewer (self-review) |
| AC-4 | AT-4a (4 cases); `AC-4 rejects amounts that are not safe integers` | `node --test --test-name-pattern="AC-4 " "test/**/*.test.js"` | 0 | `754c1c280a5f` | 2026-11-25T00:08:01Z | Reviewer (self-review) |
| AC-5 | AT-5a (3 cases); `AC-5 rejects malformed currency codes and locale tags` | `node --test --test-name-pattern="AC-5 " "test/**/*.test.js"` | 0 | `754c1c280a5f` | 2026-11-25T00:08:01Z | Reviewer (self-review) |
| AT (all) | `acceptance-tests.md` AT-1a..AT-5a, 11 tests | `node --test test/price.acceptance.test.js` | 0 | `754c1c280a5f` | 2026-11-25T00:08:01Z | Reviewer (self-review) |
| Docs | n/a — README has no API section (follow-up: none requested in spec) | n/a | n/a | `754c1c280a5f` | 2026-11-25T00:08:01Z | Reviewer (self-review) |

Note: the `AC-1 ` pattern also matches the two Quick-path tests `AC-1 slugify …` from `docs/issues/0001` (AC IDs are not namespaced per spec); they are counted but are not evidence for this spec.

### CANNOT_VERIFY

| AC | Critical | Reason | Checked instead | Verifier (role, person) | When (≤ 14 days after release) | Waiver |
|---|---|---|---|---|---|---|
| none | — | — | — | — | — | — |

### Loop ledger

| Date | Task | Loop | Round | Failure signature | Cause | Tried | Result |
|---|---|---|---|---|---|---|---|
| 2026-11-25 | T3 | red-green | 1 | AC-1 formatPrice is exported… / ERR_MODULE_NOT_FOUND ./price | code | re-export without .js extension | failed |
| 2026-11-25 | T3 | red-green | 2 | AC-1 formatPrice is exported… / ERR_MODULE_NOT_FOUND ./price | code | — | fixed |
| 2026-11-25 | T1 | review-fix | 1 | F-1 `$90,071,992,547,409.90` for MAX_SAFE_INTEGER cents | code | exact decimal string passed to `Intl.NumberFormat.format` | fixed |

The review-fix row is hand-written: `run-ledger round` refuses events after `finish` ("run s1 is finished (DONE)").

<details><summary>Output excerpts (last ≤ 40 lines per command)</summary>

```text
$ npm run lint --silent   # ID: DoD:lint · fingerprint 754c1c280a5f
lint: 9 files checked, 0 failed
$ npm test --silent   # ID: DoD:test · fingerprint 754c1c280a5f
# tests 24
# pass 24
# fail 0
$ npm run coverage --silent   # ID: DoD:coverage · fingerprint 754c1c280a5f
coverage: lines 26/26 = 100%
$ node --test test/price.acceptance.test.js   # ID: AT (all) · fingerprint 754c1c280a5f
# pass 11
# fail 0
```

</details>

## Trace

Forward: every AC has ≥ 1 task and ≥ 1 fresh passing test. Backward: every task has an AC; every commit has a Tn; every cited AC ID exists in the spec.

| AC | Tasks | Commits | Tests | Verification rows | Status |
|---|---|---|---|---|---|
| AC-1 | T1, T3 | `97ddabc`, `cc0d9f4`, `a6eb040` | AT-1a, AT-1b + 4 Developer tests | AC-1, AT (all) | ok |
| AC-2 | T1 | `97ddabc` | AT-2a + 1 Developer test | AC-2, AT (all) | ok |
| AC-3 | T1 | `97ddabc` | AT-3a + 1 Developer test | AC-3, AT (all) | ok |
| AC-4 | T2 | `7d8182f` | AT-4a (4) + 1 Developer test | AC-4, AT (all) | ok |
| AC-5 | T2 | `7d8182f` | AT-5a (3) + 1 Developer test | AC-5, AT (all) | ok |

Commits on `0fe81e1..a6eb040`: `0b7e7ce` (—) · `1c470b7` (—) · `a5e10c7` (—) · `1a3c62f` (AC-1..AC-5) · `97ddabc` (T1 AC-1 AC-2 AC-3) · `7d8182f` (T2 AC-4 AC-5) · `cc0d9f4` (T3 AC-1) · `0890cb7` merge (AC-1..AC-5) · `0806e33` (T3) · `a6eb040` (T1 AC-1 F-1 F-2).

**Orphans:** commits without a Tn — `0b7e7ce` (issue), `1c470b7` (spec, threat model, plan, approval request), `a5e10c7` (sign-off records), `1a3c62f` and merge `0890cb7` (Test Engineer acceptance tests). All are Discover/Specify/Design/Test artifacts that belong to no task; rewording them with an invented Tn would falsify the trace. Covered by waiver W-1.

## Review triage

**Reviewed SHA:** `a6eb040a7f64` · **Review round:** 2 of 3 · **Verdict:** GO

### Lenses

| Lens | Context | Checks performed | Findings raised | Status |
|---|---|---|---|---|
| L1 spec/tests | self-review (cleared context; diff, spec, plan, acceptance-tests.md, Verification rows) | 5 of 5 ACs implemented; nothing outside spec or non-goals; each AC test asserts the stated outcome; negative tests for AC-4, AC-5; tdd.md §3 on new tests; Trace orphans (5, see W-1) | 1 | ran |
| L2 correctness/design | self-review | Edge cases (−0, 0, MAX_SAFE_INTEGER, 3-digit currencies, JPY); signature matches plan; no abstraction with < 2 call sites; error messages; DoD output re-read (ExperimentalWarning for glob only) | 1 | ran |
| L3 security | self-review | security.md 20-item checklist: inputs validated (AC-4, AC-5), no secrets, no logging, no dependency added (rule 10), threat model TH-1..TH-3 mitigations present | 0 | ran |
| L4 context-free (diff only) | self-review (diff only) | Hostile input (huge ints, −0, non-strings, lowercase codes), float precision, locale injection | 2 | ran |
| explore (optional) | n/a | — | 0 | n/a |

`L2-1 + L4-1 → F-1` (same file, overlapping lines, same cause).

### Findings

| ID | Lens | Verification | Sev | File:line | Cause | Finding | Disposition | Evidence |
|---|---|---|---|---|---|---|---|---|
| F-1 | L2, L4 | confirmed | Critical | `src/price.js:5` | code | `amountMinor / 10 ** digits` loses precision: `formatPrice(Number.MAX_SAFE_INTEGER,'USD','en-US')` → `$90,071,992,547,409.90` (expected `.91`) — wrong displayed price | fixed `a6eb040` | new test red at `0806e33`, green at `a6eb040` |
| F-2 | L4 | confirmed | Minor | `src/price.js:5` | code | `formatPrice(-0, …)` → `-$0.00` | fixed `a6eb040` | new test red → green |
| F-3 | L1 | confirmed | Minor | `test/price.acceptance.test.js:22` | test | AT-4a test name prints `null` for `NaN` (`JSON.stringify(NaN)`), so the run output misnames the case | deferred → Test Engineer, follow-up `docs/issues/0003` (not created in dogfood) | `ok 3 - AC-4 AT-4a rejects amountMinor null with RangeError` |

### Rounds

| Round | Reviewed range | Lenses run | Findings checked | New findings | Verdict |
|---|---|---|---|---|---|
| 1 | `0fe81e1..0806e33` | L1, then L2, L3, L4 | — | F-1, F-2, F-3 | NO-GO (F-1 Critical) |
| 2 | `0806e33..a6eb040` | L1, L2, L4 (delta) | F-1 resolved, F-2 resolved, F-3 deferred | none | GO |

**GO conditions** (all true, else NO-GO): fresh passing row for every AC or a waived CANNOT_VERIFY · no orphans (waived, W-1) · 0 open Critical · every confirmed finding has a disposition · every required lens ran.

## Review guide

For the human reviewer (engineer) who gives Test sign-off. Read in this order.

1. **Files, riskiest first:** `src/price.js` (money formatting; the decimal-string construction at lines 5–8), `src/index.js` (public entry point), tests.
2. **Questions for the human (3–7):**
   - The fix for F-1 replaced the plan's "divide once by 10^digits" approach with a decimal string; is a plan revision needed, or is this inside T1's approved scope?
   - `Intl.NumberFormat.prototype.format` with a string argument needs Node ≥ 19/ICU with NumberFormat v3; is Node 18 support required?
   - Accept W-1 (artifact commits without a Tn) or require rewording?
3. **CANNOT_VERIFY items:** none
4. **Self-review labels:** Verification (all rows), Lenses L1–L4, acceptance-tests.md (`Designed by: self-review`)
5. **Deferred findings and waivers:** F-3 → follow-up issue 0003, Test Engineer · W-1

## Waivers

| ID | Kind (accept risk \| defer \| emergency) | Gate waived | Reason | Owner (≠ requester) | Expiry (≤ 30 days) | Follow-up issue |
|---|---|---|---|---|---|---|
| W-1 | accept risk | Trace: every commit names ≥ 1 Tn | Specify/Design/Test artifact commits belong to no task; the method defines no exemption | Tech Lead, dogfood-owner (SIMULATED; requester: Reviewer agent) | 2026-12-24 | report finding (method gap) |

## Test sign-off

No PR host: recorded here and in `approvals.md` R3 (format improvised; the template has no Test sign-off table).

| Sign-off | Head SHA | Fingerprint (code) | Date (UTC) | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|
| Test | `a6eb040a7f64` (+ review record `5d322bd`) | `754c1c280a5f` | 2026-11-25 00:10 | Human reviewer (engineer) | dogfood-owner (SIMULATED) | "yes, approved — merge it; W-1 accepted" | Verification, Trace, Review triage, Review guide, acceptance-tests.md | Node 18 string-format support unverified; F-3 deferred | approved |
