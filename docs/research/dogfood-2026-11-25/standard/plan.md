# Locale-aware price formatting — Plan

**Path:** Standard · **Spec:** `specs/001-price-format/spec.md` rev 1 (its hash is recorded in `## Approvals`) · **ADRs:** none — one pure function on the standard `Intl` API; no decision expensive to reverse

> **For the executor:** run this plan with the `executing-plans` skill, one task per fresh context, in the order of `graph.json` waves. Never start a task before its `Blocked by` tasks have a commit carrying their ID.

## Goal and architecture

**Goal:** library consumers format an integer amount of minor units as a localized currency string with `formatPrice(amountMinor, currency, locale)`.

**Architecture:** a new module `src/price.js` exports `formatPrice`; it reads the currency's minor digits from `Intl.NumberFormat(...).resolvedOptions().maximumFractionDigits`, divides once by 10^digits and formats with the same `Intl.NumberFormat`. `src/index.js` re-exports it (the only public entry point, per `docs/codemap.md`).

**Tech stack:** Node.js ≥ 18 ES modules, `node:test`; DoD: `npm run lint --silent`, typecheck n/a, `npm test --silent`, `npm run coverage --silent` (coverage_min 100.0).

## Tasks

| ID | Title | AC | Blocked by | Files | Size |
|---|---|---|---|---|---|
| T1 | Format integer minor units with Intl for any currency and locale | AC-1, AC-2, AC-3 | — | `src/price.js`, `test/price.test.js` | 2h |
| T2 | Reject non-integer amounts and malformed currency codes or locales | AC-4, AC-5 | T1 | `src/price.js`, `test/price.test.js` | 2h |
| T3 | Export formatPrice from the package entry point | AC-1 | T1 | `src/index.js`, `test/index.test.js` | 1h |

## Task details

### T1 — Format integer minor units with Intl for any currency and locale

**AC:** AC-1, AC-2, AC-3 · **Blocked by:** — · **Files:** `src/price.js` (create), `test/price.test.js` (create)

**Interface:**

```text
export function formatPrice(amountMinor: number /* safe integer */, currency: string /* ISO 4217 */, locale: string /* BCP 47 */): string
```

1. **Red.** Write the tests `AC-1 formats 123456 USD cents in en-US as $1,234.56`, `AC-2 formats 123456 EUR cents in de-DE with a no-break space before €` and `AC-3 formats 1234 JPY in en-US with no decimals` in `test/price.test.js`, importing `../src/price.js`. Run `node --test test/price.test.js`. Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/price.js`.
2. **Green.** Create `src/price.js` with `formatPrice`: build `new Intl.NumberFormat(locale, { style: 'currency', currency })`, read `resolvedOptions().maximumFractionDigits`, return `nf.format(amountMinor / 10 ** digits)`. Run `node --test test/price.test.js`. Expected: PASS (3 tests).
3. **Refactor.** None expected; tests stay green with the same command.
4. **Commit** with the trailer:

   ```text
   feat(price): format integer minor units with Intl

   Refs: T1 AC-1 AC-2 AC-3
   ```

### T2 — Reject non-integer amounts and malformed currency codes or locales

**AC:** AC-4, AC-5 · **Blocked by:** T1 · **Files:** `src/price.js` (modify), `test/price.test.js` (modify)

**Interface:** unchanged from T1; throws `RangeError`.

1. **Red.** Add `AC-4 rejects amounts that are not safe integers` (1.5, `NaN`, 2^53, `"100"`; message `amountMinor must be a safe integer`) and `AC-5 rejects malformed currency codes and locale tags` (`US`, `usd`, `xx-??`). Run `node --test test/price.test.js`. Expected: FAIL — AC-4 (no throw for 1.5) and AC-5 (`usd` is accepted by Intl).
2. **Green.** Guard with `Number.isSafeInteger(amountMinor)` and `/^[A-Z]{3}$/.test(currency)` before calling Intl; Intl rejects malformed locales itself. Run `node --test test/price.test.js`. Expected: PASS (5 tests).
3. **Refactor.** Keep both guards at the top of `formatPrice`; tests stay green.
4. **Commit** with `Refs: T2 AC-4 AC-5`.

### T3 — Export formatPrice from the package entry point

**AC:** AC-1 · **Blocked by:** T1 · **Files:** `src/index.js` (modify), `test/index.test.js` (create)

**Interface:** `import { formatPrice } from 'strkit'` (package entry `src/index.js`).

1. **Red.** Write `AC-1 formatPrice is exported from the package entry point` in `test/index.test.js` importing `../src/index.js` and asserting `formatPrice(123456, 'USD', 'en-US') === '$1,234.56'`. Run `node --test test/index.test.js`. Expected: FAIL with `TypeError: formatPrice is not a function`.
2. **Green.** Add `export { formatPrice } from './price.js';` to `src/index.js`. Run `node --test test/index.test.js`. Expected: PASS (1 test).
3. **Refactor.** None.
4. **Commit** with `Refs: T3 AC-1`.

## Impact

**Code map:** `docs/codemap.md` (updated 2026-11-24)

| Module | Paths touched | Change | Dependents | Mapped tests |
|---|---|---|---|---|
| strkit-lib | `src/price.js`, `src/index.js` | new file / modify | none | `test/**` |

**Regression scope** (scoped re-check after every fix, `references/loops.md`): `npm test --silent` (the mapped tests are the full suite). The full DoD suite runs at loop exit and before the PR.

## Dependencies

none — `Intl.NumberFormat` is built into Node.js; no package added

## Risks

| Risk | Likelihood (low/med/high) | Mitigation in this plan | Accepted by |
|---|---|---|---|
| ICU data differs between Node builds (small-icu) and changes `de-DE` output | low | AC-2 test pins the exact string; CI uses full-icu Node 22 | Tech Lead |
| Floating-point division for amounts above 2^53 / 100 | low | T2 guard rejects non-safe integers (AC-4) | Tech Lead |

## Loop ledger

| Date | Task | Loop | Round | Failure signature | Cause | Tried | Result |
|---|---|---|---|---|---|---|---|
| 2026-11-25 | T3 | red-green | 1 | AC-1 formatPrice is exported… / ERR_MODULE_NOT_FOUND ./price | code | re-export without .js extension | failed |
| 2026-11-25 | T3 | red-green | 2 | AC-1 formatPrice is exported… / ERR_MODULE_NOT_FOUND ./price | code | — | fixed |

## Revision log

| Rev | Date | Change | Reason |
|---|---|---|---|
| 1 | 2026-11-24 | First plan from spec rev 1 | — |

## Approvals

| Sign-off | Plan rev | Plan hash | Spec rev | Spec hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Specify + Design (combined) | 1 | aad1222c3fd3 | 1 | 46743045b021 | 2026-11-25 00:05 | Tech Lead | dogfood-owner (SIMULATED) | "yes, approved: plan rev 1, three tasks, go" (SIMULATED by dogfood-owner) | plan-graph exit 0 (W1 T1 · W2 T2 T3); spec-lint exit 0; critique 12/12 | ICU data differences between Node builds | approved |
