# Per-key rate limit on the public API — Plan

<!-- Example (synthetic) for the writing-plans skill. Written from ../../../agentic-sdlc/templates/plan.md;
checked by ../../../agentic-sdlc/scripts/plan-graph.mjs, which generated graph.json next to this file. -->

**Path:** Standard · **Spec:** `specs/007-api-rate-limit/spec.md` rev 1 (its hash is recorded in `## Approvals`) · **ADRs:** none — Redis is already the shared store for sessions, the window algorithm is internal and the flag makes the change reversible

> **For the executor:** run this plan with the `executing-plans` skill, one task per fresh context, in the order of `graph.json` waves. Never start a task before each of its `Blocked by` tasks has a commit carrying its ID.

## Goal and architecture

**Goal:** every public API key is limited to 100 requests per 60-second window, sees its remaining budget in two headers, and gets a 429 with `Retry-After` when it runs out.

**Architecture:** a `resolveApiKey` middleware attaches the key ID to the request (prefactor). A `rateLimit` middleware in `api-http` asks a `CounterStore` (`api-limits`) for the window count, refuses request 101 with 429 and adds the headers otherwise. `MemoryStore` serves the tracer bullet; `RedisStore` replaces it in production and returns `null` when Redis is unreachable, which the middleware treats as "allow, no headers" (fail open). The flag `rateLimit.enabled` (default off) gates the middleware; rollback = flag off.

**Tech stack:** Node 20, Express 4, TypeScript, Vitest, `ioredis` (already locked). DoD (`sdlc-dod`): `npm run lint`, `npm run typecheck`, `npm test`, `npm run coverage -- --json-summary` with `coverage_min: 81.0`, `npm run docs:check`.

## Tasks

| ID | Title | AC | Blocked by | Files | Size |
|---|---|---|---|---|---|
| T1 | Attach the resolved API key ID to each request | AC-1 | — | `src/middleware/api-key.ts`, `src/routes/v1/index.ts`, `test/middleware/api-key.test.ts` | 2h |
| T2 | Refuse request 101 in a window with 429 and Retry-After | AC-1, AC-4 | T1 | `src/limits/counter-store.ts`, `src/middleware/rate-limit.ts`, `src/config/schema.ts`, `src/server.ts`, `test/middleware/rate-limit.test.ts` | 4h |
| T3 | Report the limit and the remaining requests in response headers | AC-2 | T2 | `src/middleware/rate-limit.ts`, `test/middleware/rate-limit.test.ts` | 2h |
| T4 | Count requests in Redis and fail open when Redis is unreachable | AC-4 | T2 | `src/limits/redis-store.ts`, `test/limits/redis-store.test.ts`, `src/metrics/registry.ts`, `src/server.ts` | 4h |
| T5 | Exempt configured key IDs from the limit | AC-3 | T2 | `src/middleware/rate-limit.ts`, `test/middleware/rate-limit.test.ts`, `src/config/schema.ts`, `test/config/schema.test.ts`, `src/server.ts` | 2h |
| T6 | Document the limit, the headers and the 429 response | AC-5 | T3 | `docs/api/rate-limits.md`, `docs/api/errors.md` | 1h |

T1 is a prefactor: key lookup moves out of each handler so the limiter has one key ID to count. T2 is the tracer bullet: flag, middleware, in-memory store, wiring and an HTTP-level test, end to end; it fixes the `CounterStore` contract (including `null` = store unavailable) that T4 implements. T3 and T4 have disjoint Files and run in parallel in wave 3. T5 shares the middleware with T3 and `src/server.ts` with T4, so `plan-graph` moves it to wave 4, beside T6.

## Task details

### T1 — Attach the resolved API key ID to each request

**AC:** AC-1 (enables) · **Blocked by:** — · **Files:** `src/middleware/api-key.ts` (create), `src/routes/v1/index.ts` (modify), `test/middleware/api-key.test.ts` (create)

**Interface:**

```ts
declare module 'express-serve-static-core' { interface Request { apiKeyId?: string } }
export function resolveApiKey(keys: ApiKeyRepository): RequestHandler; // unknown or missing key → 401 { error: 'invalid_key' } (unchanged behaviour)
```

1. **Red.** Test `AC-1 resolveApiKey sets req.apiKeyId for a valid key` with the seeded test key `key_test_alpha`. Run `npx vitest run test/middleware/api-key.test.ts`. Expected: FAIL with `Failed to load url ../../src/middleware/api-key.ts`.
2. **Green.** Move the lookup from `lookupKey(req)` in the v1 handlers into `resolveApiKey`; mount it first in `src/routes/v1/index.ts`. Same command. Expected: PASS (1 test). The existing route tests stay green: `npx vitest run test/routes/v1`.
3. **Refactor.** Delete the now-unused `lookupKey`; tests stay green.
4. **Commit** `refactor(api): resolve the API key once per request` with trailer `Refs: T1 AC-1`.

### T2 — Refuse request 101 in a window with 429 and Retry-After

**AC:** AC-1, AC-4 · **Blocked by:** T1 · **Files:** `src/limits/counter-store.ts` (create), `src/middleware/rate-limit.ts` (create), `src/config/schema.ts` (modify), `src/server.ts` (modify), `test/middleware/rate-limit.test.ts` (create)

**Interface:**

```ts
export type WindowCount = { count: number; resetInSeconds: number }; // resetInSeconds in 1..60
export interface CounterStore { increment(keyId: string, now: Date): Promise<WindowCount | null> } // null = store unavailable
export class MemoryStore implements CounterStore {} // fixed 60-second windows aligned to the minute
export function rateLimit(opts: { store: CounterStore; limit: number; exempt: (keyId: string) => boolean }): RequestHandler;
// count > limit → 429 { "error": "rate_limited" } + Retry-After: <resetInSeconds>; null → next() with no headers
// src/config/schema.ts: rateLimit.enabled: boolean (default false) · rateLimit.limit: number (default 100)
// src/server.ts: when rateLimit.enabled, mount rateLimit({ store: new MemoryStore(), limit, exempt: () => false }) after resolveApiKey
```

1. **Red.** Tests `AC-1 request 101 in one window returns 429 with Retry-After`, `AC-1 request 100 in one window is served` and `AC-4 a store returning null lets the request through without rate-limit headers` (fake store at the process boundary, injected clock). Run `npx vitest run test/middleware/rate-limit.test.ts`. Expected: FAIL with `Failed to load url ../../src/middleware/rate-limit.ts`.
2. **Green.** Add the two config fields, implement `MemoryStore` and `rateLimit`, and mount it in `src/server.ts` behind the flag. Same command. Expected: PASS (3 tests).
3. **Refactor.** Name the window arithmetic `windowStart(now)`; tests stay green.
4. **Commit** `feat(api): per-key rate limit with 429 and Retry-After` with trailer `Refs: T2 AC-1 AC-4`.

### T3 — Report the limit and the remaining requests in response headers

**AC:** AC-2 · **Blocked by:** T2 · **Files:** `src/middleware/rate-limit.ts` (modify), `test/middleware/rate-limit.test.ts` (modify)

**Interface:**

```text
served request with a WindowCount → X-RateLimit-Limit: 100 · X-RateLimit-Remaining: max(0, 100 - count)
429 response → X-RateLimit-Remaining: 0 · store returned null → neither header (AC-4)
```

1. **Red.** Tests `AC-2 the first request in a window reports 99 remaining` and `AC-2 request 100 reports 0 remaining`. Run `npx vitest run test/middleware/rate-limit.test.ts -t "AC-2"`. Expected: FAIL with `expected undefined to be "99"`.
2. **Green.** Set both headers before `next()` and on the 429 path. Same command. Expected: PASS (2 tests).
3. **Refactor.** One `setLimitHeaders(res, count)` helper; the whole file stays green with `npx vitest run test/middleware/rate-limit.test.ts`.
4. **Commit** `feat(api): rate-limit headers` with trailer `Refs: T3 AC-2`.

### T4 — Count requests in Redis and fail open when Redis is unreachable

**AC:** AC-4 · **Blocked by:** T2 · **Files:** `src/limits/redis-store.ts` (create), `test/limits/redis-store.test.ts` (create), `src/metrics/registry.ts` (modify), `src/server.ts` (modify)

**Interface:**

```ts
export class RedisStore implements CounterStore {
  constructor(redis: Redis, metrics: { storeErrors: Counter });
  // INCR rl:<keyId>:<windowStart> + EXPIRE 60 in one MULTI; any connection or command error →
  // metrics.storeErrors.inc() and resolve null (never reject)
}
// src/metrics/registry.ts: storeErrors = new Counter({ name: 'rate_limit_store_errors_total', help: 'Rate-limit store failures' })
// src/server.ts: replace new MemoryStore() with new RedisStore(redis, metrics) (the existing sessions client)
```

1. **Red.** Tests `AC-4 a closed Redis connection resolves null and increments rate_limit_store_errors_total` and `AC-1 RedisStore counts 101 increments in one window as 101` against the Redis test container from `test/setup/redis.ts`. Run `npx vitest run test/limits/redis-store.test.ts`. Expected: FAIL with `Failed to load url ../../src/limits/redis-store.ts`.
2. **Green.** Implement `RedisStore`, register the counter and swap the store in `src/server.ts`. Same command. Expected: PASS (2 tests). The scoped re-check `npx vitest run test/middleware` stays green.
3. **Refactor.** None beyond naming; tests stay green.
4. **Commit** `feat(api): Redis counter store with fail-open` with trailer `Refs: T4 AC-4`.

### T5 — Exempt configured key IDs from the limit

**AC:** AC-3 · **Blocked by:** T2 · **Files:** `src/middleware/rate-limit.ts` (modify), `test/middleware/rate-limit.test.ts` (modify), `src/config/schema.ts` (modify), `test/config/schema.test.ts` (modify), `src/server.ts` (modify)

**Interface:**

```ts
// config: rateLimit.exemptKeyIds: string[] (default []); each entry matches /^key_[a-z0-9_]+$/ or config load fails
exempt: (keyId) => config.rateLimit.exemptKeyIds.includes(keyId) // checked before store.increment; exempt → next(), no headers
```

1. **Red.** Tests `AC-3 an exempt key is served on request 150 without rate-limit headers` and `AC-3 config rejects an exempt entry that is not a key ID`. Run `npx vitest run test/middleware/rate-limit.test.ts test/config/schema.test.ts -t "AC-3"`. Expected: FAIL with `expected 429 to be 200`.
2. **Green.** Add the schema field and pass `exempt` from `src/server.ts`. Same command. Expected: PASS (2 tests).
3. **Refactor.** None beyond naming; tests stay green.
4. **Commit** `feat(api): exempt key IDs from the rate limit` with trailer `Refs: T5 AC-3`.

### T6 — Document the limit, the headers and the 429 response

**AC:** AC-5 · **Blocked by:** T3 · **Files:** `docs/api/rate-limits.md` (create), `docs/api/errors.md` (modify) · **Agent:** Tech Writer (docs trigger)

**Interface:**

```text
docs/api/rate-limits.md: limit (100 per 60-second window per key) · both headers with one example response · 429 body and Retry-After · fail-open note
docs/api/errors.md: row "429 rate_limited" linking to rate-limits.md
```

1. **Check (no executable behaviour; closes with `--no-red "docs only"`).** Run `npm run docs:check`. Expected: PASS with 0 broken links and the new page listed in the sidebar output.
2. **Commit** `docs(api): rate-limit reference` with trailer `Refs: T6 AC-5`.

## Impact

**Code map:** `docs/codemap.md` (updated 2026-11-24: module `api-limits` added for `src/limits/**` before this table was filled)

| Module | Paths touched | Change | Dependents | Mapped tests |
|---|---|---|---|---|
| api-http | `src/middleware/api-key.ts`, `src/middleware/rate-limit.ts`, `src/routes/v1/index.ts`, `src/server.ts` | new files; modify (mount, wiring) | none | `test/middleware/**`, `test/routes/v1/**` |
| api-limits | `src/limits/counter-store.ts`, `src/limits/redis-store.ts` | new files | api-http | `test/limits/**`, `test/middleware/**`, `test/routes/v1/**` |
| api-config | `src/config/schema.ts` | modify (new field) | api-http, api-limits | `test/config/**`, `test/middleware/**`, `test/limits/**` |
| api-metrics | `src/metrics/registry.ts` | modify (new counter) | api-http, api-limits | `test/metrics/**`, `test/limits/**` |
| docs-api | `docs/api/rate-limits.md`, `docs/api/errors.md` | new file; modify | none | `npm run docs:check` |

**Regression scope** (scoped re-check after every fix, `references/loops.md`): `npx vitest run test/middleware test/routes/v1 test/limits test/config test/metrics`. The full DoD suite runs at loop exit and before the PR.

## Dependencies

none — the counter store uses `ioredis`, already pinned in the lockfile for sessions; no package is added or upgraded.

## Risks

| Risk | Likelihood (low/med/high) | Mitigation in this plan | Accepted by |
|---|---|---|---|
| Redis latency adds more than 5 ms at p95 | med | One `MULTI` round trip per request (T4); measured in staging before 100% rollout | Tech Lead |
| A Redis outage silently disables limiting | low | Fail-open is the spec's choice (AC-4); `rate_limit_store_errors_total` feeds the spec alert | Product Owner |
| The change grows past the Standard file bound | low | 14 files listed against a bound of 15; any extra file → stop and re-score (`references/paths.md` §4) | Tech Lead |

## Loop ledger

| Date | Task | Loop | Round | Failure signature | Cause | Tried | Result |
|---|---|---|---|---|---|---|---|

## Revision log

| Rev | Date | Change | Reason |
|---|---|---|---|
| 1 | 2026-11-24 | First plan from spec rev 1 | — |

## Approvals

| Sign-off | Plan rev | Plan hash | Spec rev | Spec hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Design | 1 | aa691d17e1a9 | 1 | cfd4bf1b73a7 | 2026-11-24 11:30 | Tech Lead | R. Iyer | "Yes, plan rev 1 approved. Keep the Redis call to one round trip." | plan-graph exit 0 (W1 T1 · W2 T2 · W3 T3 T4 · W4 T5 T6, 2 file conflicts); self-review 12/12; plan review READY (rev 1, 1 Important fixed: T5 now lists `src/server.ts`); AC ↔ task coverage 5/5 | p95 latency unmeasured until staging; 14 of 15 Standard files used; condition: one Redis round trip per request (owner: Developer of T4, checked by the Reviewer) | approved with conditions |
