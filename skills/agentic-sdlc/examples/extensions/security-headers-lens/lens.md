# Lens: HTTP security headers

Extension lens for the `review.lenses` point. It runs after L1–L4 in its own fresh context and never replaces a core lens. Findings use the core format (`references/review.md` §1 rule 2) with the prefix `XH-k` and cause `code`.

**Receives:** the diff, plus the server, framework or proxy configuration files that set response headers.

**Runs when:** the diff adds or changes an HTTP route, a response middleware, or web-server or proxy configuration. Otherwise it reports `not triggered` and lists no checks.

## Checks

| ID | Check | Severity if FAIL |
|---|---|---|
| XH1 | Responses that render HTML set a `Content-Security-Policy`; the policy has no `unsafe-inline` or `unsafe-eval` in `script-src` unless the spec names the reason | Important |
| XH2 | HTTPS responses set `Strict-Transport-Security` with `max-age` ≥ 15552000 (180 days) | Important |
| XH3 | `X-Content-Type-Options: nosniff` is set on every response that carries a body | Minor |
| XH4 | Framing is restricted: CSP `frame-ancestors` or `X-Frame-Options`, unless the spec allows embedding | Important |
| XH5 | `Referrer-Policy` is set and is not `unsafe-url` | Minor |
| XH6 | A header the diff removes or weakens has a spec or ADR line that says why | Critical |

## Evidence

For each check, cite the configuration line or the response headers printed by a command (for example `curl -sI <local url>`), with its exit code. A check that cannot run locally is `declined to judge` with the reason, never a pass.
