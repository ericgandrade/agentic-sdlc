# Mocking and Seams

Load when a test crosses a dependency, needs a test double, or seems to need more than one mock. The contract rule (`../../agentic-sdlc/references/tdd.md` §1 rule 3): **doubles only at process boundaries — network, clock, randomness, filesystem outside the test's temporary directory, third-party APIs, browser `fetch`; more than 1 mocked collaborator in one unit test needs a one-line comment stating why a real collaborator is unusable; never mock the module under test or a value object.**

## 1. Seams

A **seam** is a place where a test can observe or substitute behaviour without editing the code under test. In this method the seam under test is the interface signature fixed in the plan task.

| Rule | Meaning |
|---|---|
| The interface is the test surface | Tests cross the same seam callers cross. A test that must reach past it (private function, internal field, a database row read behind the API) signals the wrong module shape: report it, do not expose internals |
| Highest seam that runs in ≤ 1 s | Prefer the outermost interface the plan names; drop one level only when the higher seam is slower than the unit budget, and then add the higher-level test to the integration suite |
| One seam per slice | A slice's tests share one seam; a second seam needs its own seam note |
| One adapter is a hypothetical seam | Do not add a port or interface for a single production implementation "for testability"; a port earns its place with two real adapters (production + test fake) — simplicity rule: ≥ 2 call sites |
| No test-only production API | `reset()`, `destroy()` or `__setState()` called only from tests belongs in test utilities |

**Seam note format** (comment above the slice's first test): `Seam: <signature> — catches: <behaviours> · misses: <what this seam cannot see, and where it is covered>`.

## 2. Integration-first

The first test of a slice exercises the seam with its real in-process collaborators and local substitutes. Isolated unit tests with doubles come second, only where the integrated test cannot reach a branch within the 1 s budget.

Why: a suite of isolated unit tests that each mock their neighbours can be fully green while the wired system is broken. Exercising the real wiring at the seam catches contract mismatches between the modules this task touches.

Limits: an integration-level test still obeys the contract's duration rule — unit tests ≤ 1 s; anything slower moves to the integration suite and runs in the DoD, not in the inner red-green loop.

## 3. Dependency categories → what to use

| Category | Examples | Use in tests | Double? |
|---|---|---|---|
| In-process | Pure functions, validators, value objects, domain services, mappers | The real thing | Never |
| Local-substitutable | Database with a local engine (SQLite, PGlite, Testcontainers), filesystem in the test's temp directory, in-memory queue | Seeded local substitute or in-memory fake that implements the same interface | Fake only (no mock) |
| Owned remote | The team's own service over HTTP/gRPC/queue | In-memory adapter behind a port that has a production adapter too; contract test for the real adapter in the integration suite | Fake at the port |
| True external | Payment provider, email, SMS, third-party API, browser `fetch` | Stub or mock at the boundary with complete, realistic responses | Yes |
| Nondeterministic | Clock, randomness, UUIDs, timers | Injected clock or seeded generator | Yes (controlled) |

## 4. Test doubles catalogue (prefer from the top)

| Double | What it is | Use when | Assert on it? |
|---|---|---|---|
| Real | The production collaborator | In-process code; always first choice | — |
| Fake | Working lightweight implementation (in-memory store, fake clock) | Local-substitutable and owned-remote dependencies | Assert through the interface, not on the fake's internals |
| Stub | Returns canned answers | External reads (rate lookup, feature flag) | No — it only feeds the test |
| Spy | Real or fake that records calls | The emitted effect **is** the behaviour (email sent, event published) | Yes: arguments and count, when they are the contract |
| Mock | Pre-programmed with expectations, fails on unexpected calls | A strict protocol with an external system (call order is the contract) | Yes, sparingly |

Rules for any double:
1. **List the real dependency's side effects first.** Double the slow or external part and keep real whatever the behaviour under test depends on. Doubling a whole catalog service also removes the duplicate check the test was about.
2. **Complete responses.** Mirror every documented field of the real response; a partial stub passes while the real integration breaks on a missing field.
3. **One fixture per branch:** success, error, malformed or timeout — each as its own named test.
4. **No logic in doubles.** A double with `if` branches is a second implementation to maintain. Prefer SDK-style interfaces (`payments.charge`, `payments.refund`) over one generic `request(method, path)` so each double returns one shape.
5. **Never assert only on a double.** The test also asserts the observable result (A1).

## 5. Design moves that remove the need to mock

| Symptom | Move |
|---|---|
| `new StripeClient(process.env.KEY)` inside the function | Inject the client through the signature or constructor |
| `Date.now()` / `datetime.now()` inside logic | Pass a clock (`now: () => Date`) |
| Logic and I/O interleaved | Split: pure core (tested with values) + thin shell (tested at the seam) |
| Must mock 3+ collaborators to reach a branch | The unit is too coupled; report a design concern instead of stacking mocks |
| Huge setup to reach the code | Extract a builder for the domain object, or report the design smell |

## 6. Good / bad: over-mocking

Bad (four doubles, asserts calls, passes when wiring is broken):

```ts
it("AC-2 duplicate email is rejected", async () => {
  const repo = { findByEmail: vi.fn().mockResolvedValue({ id: 1 }) };
  const validator = { isValid: vi.fn().mockReturnValue(true) };
  const hasher = { hash: vi.fn() };
  const mailer = { send: vi.fn() };
  await new SignupService(repo, validator, hasher, mailer).signup("ana@example.test", "pw");
  expect(mailer.send).not.toHaveBeenCalled();
});
```

Good (real validator and hasher, in-memory store, mailer faked at the boundary):

```ts
it("AC-2 duplicate email is rejected", async () => {
  const store = new InMemoryUserStore([{ email: "ana@example.test" }]);
  const mailer = new RecordingMailer(); // boundary: outbound email
  const service = new SignupService(store, realValidator, realHasher, mailer);

  const result = await service.signup("ana@example.test", "pw-123456");

  expect(result).toEqual({ ok: false, error: "DUPLICATE_EMAIL" });
  expect(mailer.sent).toEqual([]);
});
```

## 7. Justification line format

Second mocked collaborator in one unit test:

```ts
// mock-justification: tax provider has no sandbox and no local stand-in (true external)
```

The Reviewer reads every such line; "faster" or "simpler" is not a justification.
