# Writing Good Tests

Load while writing or reviewing any test body in Build. The contract rules (names, placement, ≤ 1 s unit tests, anti-patterns A1–A14) are in `../../agentic-sdlc/references/tdd.md` §2–§3; this file shows how to meet them.

## 1. The seven properties

| # | Property | Check | Fails as |
|---|---|---|---|
| 1 | **Named for what it proves** | Name starts with `AC-n`, `CHAR-n` or `BUG-n`, then a behaviour a product person recognizes | A13 |
| 2 | **One behaviour** | One act step (≤ 3 for a sequence the AC defines), ≤ 50 lines, one reason to fail | A9 |
| 3 | **Through the public interface** | Calls only the signature in the plan task; asserts its return, its state change or its emitted effect | A6 |
| 4 | **Independent expectation** | Expected values are literals from the AC text, a worked example or a hand-checked fixture | A7 |
| 5 | **Deterministic** | No real clock, randomness, network, sleep or shared mutable state; passes with `--shuffle` and alone | A3, A4, A10 |
| 6 | **Can fail** | Its break is named (SKILL.md Step 1) and at least 1 mutant is killed (Step 5) | A2, A7 |
| 7 | **Synthetic data** | Fixtures invented for the test; no production record, token or customer name | A14 |

## 2. Naming by language

The ID must appear in the reported test name so `run-ledger red --test` and the Reviewer's trace can find it.

| Runner | Pattern | Example |
|---|---|---|
| Vitest / Jest / Mocha | string name | `it("AC-4 more than 50,000 rows returns 422 ROW_LIMIT", ...)` |
| `node --test` | string name | `test("BUG-418 empty filter returns the header row", ...)` |
| pytest | function name + docstring | `def test_ac_4_more_than_50000_rows_returns_422():` `"""AC-4 more than 50,000 rows returns 422 ROW_LIMIT"""` |
| Go | subtest name | `t.Run("AC-4 more than 50,000 rows returns 422", ...)` |
| JUnit 5 | `@DisplayName` | `@DisplayName("AC-4 more than 50,000 rows returns 422")` |
| RSpec | `it` string | `it "CHAR-3 legacy rounding keeps half-even"` |

Name the **what**, never the **how**: `AC-2 duplicate email is rejected`, not `AC-2 calls repository.findByEmail`.

## 3. Shape: Arrange · Act · Assert

- **Arrange** the minimum state the behaviour needs, in the test itself or a named builder (`aReportWith(50_001).rows()`). Prefer DAMP (descriptive and meaningful) over DRY: each test reads as a complete story without jumping to five helpers.
- **Act** once, through the interface.
- **Assert** the outcome the AC names: value, state, error type and code, emitted event. Specific beats broad: `toEqual({ status: 422, code: "ROW_LIMIT" })`, not `toBeTruthy()`.
- Error paths: assert the specific error; never wrap the act in `try/catch` with an empty catch (A8). Async: `await` the act and use the runner's rejection matcher.

## 4. Paired examples

### 4.1 Tautology vs literal expectation (TypeScript, Vitest)

Bad — the expectation mirrors the implementation, so it passes for any formula:

```ts
it("AC-2 applies the discount", () => {
  const order = { total: 120 };
  expect(applyDiscount(order).total).toBe(order.total - order.total * DISCOUNT_RATE);
});
```

Good — literal from the AC ("10% off orders over 100"), plus the boundary:

```ts
it("AC-2 orders over 100 get 10% off", () => {
  expect(applyDiscount({ total: 120 }).total).toBe(108);
});

it("AC-2 an order of exactly 100 gets no discount", () => {
  expect(applyDiscount({ total: 100 }).total).toBe(100);
});
```

Break named: changing `>` to `>=` fails the second test; changing the rate fails the first.

### 4.2 Implementation-coupled vs behaviour (Python, pytest)

Bad — verifies through a side channel and pins internal calls:

```python
def test_ac_1_create_user(mocker):
    repo = mocker.Mock()
    service = SignupService(repo=repo)
    service.create_user("ana@example.test", "pw-123456")
    repo.insert.assert_called_once()          # how, not what
```

Good — the user becomes retrievable through the same interface callers use:

```python
def test_ac_1_created_user_can_be_fetched(user_store):
    """AC-1 a created user can be fetched by email"""
    service = SignupService(store=user_store)          # in-memory store fixture
    service.create_user("ana@example.test", "pw-123456")
    assert service.get_user("ana@example.test").email == "ana@example.test"
```

### 4.3 Sleeping vs controlled clock (TypeScript)

Bad:

```ts
it("AC-6 invitations expire after 7 days", async () => {
  const inv = createInvitation();
  await new Promise((r) => setTimeout(r, 2000)); // still not 7 days; flaky and slow
  expect(isExpired(inv)).toBe(false);
});
```

Good — the clock is a boundary, injected:

```ts
it("AC-6 an invitation is expired 7 days and 1 second after creation", () => {
  const clock = fixedClock("2026-01-01T00:00:00Z");
  const inv = createInvitation({ clock });
  clock.advance({ days: 7, seconds: 1 });
  expect(isExpired(inv, { clock })).toBe(true);
});
```

### 4.4 Giant test vs one behaviour each (Python)

Bad — four behaviours, one name, the first failure hides the rest:

```python
def test_export():
    assert export(rows(10)).status == 200
    assert export(rows(50_001)).status == 422
    assert export([]).body == HEADER + "\n"
    assert export(rows_with("=SUM(A1)")).body.count("'=") == 1
```

Good — one per AC, each named:

```python
def test_ac_4_more_than_50000_rows_returns_422():
    """AC-4 more than 50,000 rows returns 422 ROW_LIMIT"""
    assert export(rows(50_001)).status == 422

def test_ac_7_formula_cells_are_prefixed_with_apostrophe():
    """AC-7 text cells starting with = are prefixed with an apostrophe"""
    assert export(rows_with("=SUM(A1)")).body.splitlines()[1] == "'=SUM(A1)"
```

### 4.5 Table-driven with literal `want` (Go)

```go
func TestAC3_RoundsHalfEven(t *testing.T) {
    cases := []struct{ in string; want string }{
        {"2.345", "2.34"}, {"2.355", "2.36"}, {"-2.345", "-2.34"},
    }
    for _, c := range cases {
        t.Run("AC-3 rounds "+c.in+" half-even", func(t *testing.T) {
            if got := Round(c.in, 2); got != c.want {
                t.Fatalf("Round(%s) = %s, want %s", c.in, got, c.want)
            }
        })
    }
}
```

Each row is a literal; no `want` is computed by a helper from the code under test.

## 5. What earns a test

| Earns a test | Does not |
|---|---|
| Behaviour an AC names, including each unhappy path (invalid input, missing permission, limit exceeded) | A constant asserted equal to itself |
| A constructor or getter that validates, normalizes, defaults or derives | A plain getter, a forwarding call, a type declaration |
| The project's contract with a framework (route registered, query emitted, payload sent) | The framework's own mechanics |
| One narrow characterization test where an upstream library surprised the team | Grepping source, config or a skill file for a line of text |

## 6. Warning signs (stop and rewrite)

1. Arrange and assert share the same object or helper, so the assertion cannot disagree.
2. The test can only fail by crashing, never on an assertion.
3. It fails on every intentional change but would pass on an accidental one (change detector).
4. Expected values hide behind loops, builders or helpers that call production code.
5. It still passes after the production function body is replaced with `return default`.
6. It exists only to raise coverage; no break can be named.
7. It asserts a mock's own return value or a mock test ID.
8. A production method is called only from tests (test-only API leaking into the product).
9. Mock setup is more than half the test.
10. A double was added "just to be safe" with no boundary reason.
11. A snapshot over 30 lines, or any snapshot without a named reason.

## 7. Self-check before commit

- [ ] Every new test name starts with `AC-n`, `CHAR-n` or `BUG-n` and states one behaviour.
- [ ] Each was run alone and seen failing for the expected reason (output pasted).
- [ ] Expected values are literals or hand-checked fixtures.
- [ ] No sleep, real clock, network, randomness or shared state in unit tests; each ≤ 1 s.
- [ ] At most 1 mocked collaborator per unit test, or a justification line.
- [ ] Each test killed at least 1 mutant (Step 5 table).
- [ ] No `.only`, `.skip`, `xit`, `@Disabled`, empty catch or production data.
