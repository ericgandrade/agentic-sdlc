# Condition-Based Waiting

Load in Step 2 when a test fails intermittently, when a failure differs between local runs and CI, or when the code under test or the test contains `sleep`, `setTimeout`, `time.sleep`, `Thread.sleep`, `waitForTimeout` or a fixed delay. Sleeping is anti-pattern A3 in `../agentic-sdlc/references/tdd.md` §3; the Reviewer raises it as an Important finding.

## 1. Why fixed delays fail

A fixed delay encodes a guess about how long something takes on the machine where the test was written. On a loaded CI worker the guess is too short (the test fails), and on a fast machine it is too long (the suite is slow). Raising the delay hides the race and makes the suite slower; it never removes the race.

## 2. The rule

Wait for the condition the test actually depends on, by polling it with a timeout:

| Element | Value |
|---|---|
| Condition | A function that reads the real state each time it is called and returns a truthy result when ready |
| Poll interval | 10–50 ms (not 1 ms: it burns CPU and starves the code being waited on) |
| Timeout | 5 s default for unit and component tests; ≤ 30 s for integration tests; always finite |
| Timeout error | `Timed out after <ms> ms waiting for <description>; last seen: <value>` |
| Return | The value that satisfied the condition, so the test asserts on it |

### Reference helper (JavaScript)

```js
export async function waitFor(condition, description, { timeoutMs = 5000, intervalMs = 20 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last;
  for (;;) {
    last = await condition();
    if (last) return last;
    if (Date.now() >= deadline) {
      throw new Error(`Timed out after ${timeoutMs} ms waiting for ${description}; last seen: ${JSON.stringify(last)}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
```

### Reference helper (Python)

```python
import time, json

def wait_for(condition, description, timeout_s=5.0, interval_s=0.02):
    deadline = time.monotonic() + timeout_s
    while True:
        last = condition()
        if last:
            return last
        if time.monotonic() >= deadline:
            raise TimeoutError(f"Timed out after {timeout_s}s waiting for {description}; last seen: {last!r}")
        time.sleep(interval_s)
```

Use the framework's own helper when it has one (`waitFor` in Testing Library, `expect.poll` in Playwright, `Awaitility` in Java, `eventually` in ScalaTest); the rules in §2 still apply to its arguments.

## 3. Patterns

| Waiting for | Condition | Before | After |
|---|---|---|---|
| An event | the event list contains the type | `await sleep(300); expect(events).toContain('saved')` | `await waitFor(() => events.find(e => e.type === 'saved'), 'saved event')` |
| A count | length reaches N | `sleep(1000)` then assert 3 jobs | `waitFor(() => queue.done().length >= 3 && queue.done(), '3 finished jobs')` |
| A state | status field equals the target | `sleep(2)` then `assert order.status == "paid"` | `wait_for(lambda: repo.get(id).status == "paid", "order paid")` |
| A file | the file exists and is complete | `sleep(500)` then read | wait until the file exists **and** its size is stable across two polls |
| A server | port answers | `sleep 5` in a CI script | loop on `curl -sf localhost:3000/health` with a 30 s deadline |
| A UI element | element visible with the expected text | `page.waitForTimeout(1000)` | `await expect(page.getByRole('status')).toHaveText('Exported')` |

## 4. Mistakes

| Mistake | Effect | Fix |
|---|---|---|
| Reading state once outside the loop | The condition never changes | Read inside the condition function |
| No timeout | A hung test blocks the suite until the CI job is killed | Always a finite timeout with a descriptive error |
| Catching the timeout and continuing | The assertion that follows passes on stale data | Let the timeout fail the test |
| Polling at 1 ms | CPU contention slows the code being waited on; more flakes | 10–50 ms |
| Waiting on a log line | Log format changes break the test | Wait on the state the log describes |

## 5. When a fixed delay is legitimate

Only when the behaviour under test is itself time-based (debounce, rate limit window, retry back-off), and only when the clock cannot be injected or faked. Then: first wait for the triggering condition; base the delay on the known timing (for example 2 intervals × 100 ms = 200 ms plus one interval of margin); write a one-line comment stating the timing it depends on. Prefer a fake clock (`vi.useFakeTimers()`, `freezegun`, an injected `Clock`) whenever the code allows it.

## 6. Proving a flake fix

A flaky test is fixed when the red rate measured before the change (`references/red-loop-construction.md` §4, for example 14/50 red under 8 parallel workers) drops to 0/50 under the same stress after the change, and the run time did not grow. Record both rates in the debug round: `--tried "H2: assertion read job state before the worker committed; replaced sleep(300) with waitFor(job committed) — 14/50 → 0/50"`.
