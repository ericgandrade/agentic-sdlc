# Acceptance tests — 001-price-format

**Spec:** `specs/001-price-format/spec.md` rev 1 · sha256 `46743045b021` (a later spec revision voids the rows of every changed AC)
**Base commit:** `0fe81e1994c7` (the only code the designer read)
**Designed by:** self-review — separate pass from a cleared context
**Inputs read:** spec.md, test conventions in `test/slugify.test.js` and `package.json` (`node --test`), code at the base commit · **Not seen:** implementation diff, feature branch, PR text

## Map

| AC | Critical | Test ID | Test name (contains the AC ID) | Level | File | Failure it catches | Negative |
|---|---|---|---|---|---|---|---|
| AC-1 | yes | AT-1a | `AC-1 AT-1a formats 123456 USD minor units in en-US as $1,234.56` | unit | `test/price.acceptance.test.js` | amount not divided by 100, or grouping missing | no |
| AC-1 | yes | AT-1b | `AC-1 AT-1b formats a negative amount with the locale minus sign` | unit | `test/price.acceptance.test.js` | sign dropped or `Math.abs` applied | no |
| AC-2 | yes | AT-2a | `AC-2 AT-2a formats 123456 EUR minor units in de-DE with a no-break space before the euro sign` | unit | `test/price.acceptance.test.js` | locale ignored (en-US format used), or regular space instead of U+00A0 | no |
| AC-3 | yes | AT-3a | `AC-3 AT-3a formats 1234 JPY in en-US with no decimals` | unit | `test/price.acceptance.test.js` | fixed divisor 100 used for every currency (prints ¥12.34) | no |
| AC-4 | yes | AT-4a | `AC-4 AT-4a rejects amountMinor … with RangeError` (4 cases: 1.5, NaN, 2^53, "100") | unit | `test/price.acceptance.test.js` | floats or strings formatted silently | yes |
| AC-5 | no | AT-5a | `AC-5 AT-5a rejects currency … with locale … with RangeError` (3 cases: US, usd, xx-??) | unit | `test/price.acceptance.test.js` | lowercase currency accepted by Intl and displayed | yes |

## Red at the base commit

| Test ID | Command | Exit | Failure line (first assertion or error) |
|---|---|---|---|
| AT-1a, AT-1b, AT-2a, AT-3a, AT-4a, AT-5a | `node --test test/price.acceptance.test.js` | 1 | `SyntaxError: The requested module '../src/index.js' does not provide an export named 'formatPrice'` |

## Green at the PR head

| Test ID | Command | Exit | Fingerprint | Time (ISO-8601) |
|---|---|---|---|---|
| AT-1a, AT-1b, AT-2a, AT-3a, AT-4a, AT-5a (11 tests) | `node --test test/price.acceptance.test.js` | 0 | `754c1c280a5f` | 2026-11-25T00:08:01Z |

## Not verifiable before release

| AC | Critical | Reason | Checked instead | Verifier (role, person) | When (≤ 14 days after release) |
|---|---|---|---|---|---|
| none | — | — | — | — | — |

## Coverage check

| Check | Result |
|---|---|
| Every AC in the spec has ≥ 1 row in Map | yes |
| Every Test ID cites an AC that exists in the spec | yes |
| Every input, permission or limit AC has a negative test | yes (AC-4, AC-5) |
| Every test was red at the base commit | yes — all for the same reason (export missing); per-AC red reasons are proven by the Developer's TDD red steps |
