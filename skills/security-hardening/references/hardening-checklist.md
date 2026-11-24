# Hardening Checklist and Patterns

Load in Build when a task touches an entry point, input, query, file, export, log line, configuration or dependency, and in Test when running review lens L3. The 20 checks S1–S20, their evidence and severity floors are defined in `../../agentic-sdlc/references/security.md` §Review checklist; this file adds the pattern behind each check, a bad/good sketch in neutral pseudo-code, and the test that proves it. Never mark a check PASS from this file alone: PASS needs file:line or command output from the change.

## 1. Defaults for spec Constraints

Insert these into `spec.md` §Constraints when the change touches the area named.

| Tier | Rule |
|---|---|
| **Always** | Validate external input at the boundary · parameterize every query and command · encode output for its sink · check authorization on the server for every request and object · read secrets from the environment or a secret manager · log IDs, never values of Personal or Secret data · run the dependency audit when the lockfile changes |
| **Ask first** | A new authentication flow or change to session handling · storing a new category of Personal data · a new external integration or outbound URL fetch · CORS changes · file upload handlers · rate-limit changes · granting a broader role or database grant · a new dependency (rule 10) |
| **Never** | Commit a secret · trust client-side checks · build SQL, shell commands or paths from strings · `eval` or raw HTML with user data · put tokens in client-readable storage · show stack traces or queries in responses · disable a security header or check to make a test pass |

## 2. Patterns by area

### Authentication and authorization (S5, S6, S7)

- Deny by default: a new route is unreachable until a check grants it. The check runs on the server, near the data, not only in the UI.
- Object-level check: load the object, compare its owner or tenant with the caller, and answer 404 when it does not match (404 avoids confirming the object exists; 403 when the resource is not secret but the action is forbidden).
- Identity comes from the session or verified token, never from a request field such as `userId` in the body.

```text
BAD   order = db.find(req.params.id); return order
GOOD  order = db.find(req.params.id)
      if order is null or order.tenant != session.tenant: return 404
      if not session.can("orders:read"): return 403
      return project(order, allowlist=[id, date, total])
```

Proving tests: unauthenticated call → 401; user without permission → 403; user A reading B's object → 404 with none of B's fields. Grants: new database roles and service tokens list only the tables and verbs used (`GRANT SELECT ON orders TO reports_export`), never `ALL`.

### Input validation (S8)

- Validate type, length, range and allowlist at the boundary into a parsed object; downstream code uses only the parsed object.
- Reject with 422 (or 400) naming the field; never silently truncate.
- Typical bounds: free-text title 1–200 characters trimmed; description ≤ 2,000; page size ≤ 100; numeric IDs positive integers; enums from an allowlist.

Proving test: each bound at max and max + 1; a wrong type; an unknown enum value.

### Injection: SQL, shell, path, template (S9)

```text
BAD   db.query("SELECT * FROM orders WHERE region = '" + region + "'")
BAD   run("convert " + filename + " out.pdf")
GOOD  db.query("SELECT id, total FROM orders WHERE region = ?", [region])
GOOD  run(["convert", "--", filename, "out.pdf"])   # argument array, no shell
```

Dynamic identifiers (sort column, table) come from an allowlist map, never from the request string. Templates render with auto-escaping on.

### Output encoding, including CSV and formula injection (S10)

| Sink | Encoding |
|---|---|
| HTML | Framework escaping; raw HTML only through an allowlist sanitizer |
| CSV / spreadsheet | A cell whose first character is `=`, `+`, `-`, `@`, tab (0x09) or carriage return (0x0D) is prefixed with a single quote `'`; then quote the cell and double any `"` inside it |
| JSON | Serializer, never string concatenation |
| HTTP headers | Strip CR and LF from any value placed in a header; file names in `Content-Disposition` restricted to `[A-Za-z0-9._-]` |
| Logs | Strip CR and LF from user values to prevent forged log lines |

Formula-prefix note: the prefix changes negative numbers written as text (`-12.50` → `'-12.50`). Write numeric columns as numbers from typed values and apply the prefix to text columns, or state in the AC which columns are prefixed.

Proving test: an export row whose text cell is `=HYPERLINK("http://x","y")` reads `'=HYPERLINK(...)` in the file bytes.

### Server-side request forgery (SSRF) (S11, S12; OWASP 2025 places it under A01)

When the server fetches a URL that a user influences:
1. Allow only `https` and a host allowlist from configuration.
2. Resolve the host and reject if **any** resolved address is loopback, private, link-local (including `169.254.169.254`), unique-local or unspecified, for IPv4 and IPv6.
3. Connect to the resolved address that passed the check (prevents DNS rebinding between check and use); disable redirects or re-check each hop.
4. Timeout ≤ 10 s, response size cap, no credentials forwarded.

Proving test: URLs pointing to `127.0.0.1`, `[::1]`, `10.0.0.5`, `169.254.169.254` and a redirect to one of them are each refused before a connection opens.

### Files, paths and uploads (S11)

- Resolve the real path (following symlinks) before checking that it lies under an allowlisted root; compare resolved paths, not strings.
- Uploads: allowlist of MIME types confirmed by the file's leading bytes, size cap (for example 5 MB), stored under a generated name outside the web root.
- Destructive operations on derived paths (cleanup, overwrite): target at least one level below the allowlisted root, never the root itself; on refusal log the target and stop, never fall back to a broader path.

### Resource limits (S12)

Every new endpoint or job names its limits in the spec: row cap, page size, request timeout, rate limit per user, queue length. Rate limits use a shared store when the service runs on more than one instance; an in-process counter multiplies the limit by the instance count.

### Cryptography and tokens (S13)

- Passwords: argon2id, scrypt or bcrypt (cost ≥ 12); never MD5, SHA-1 or unsalted hashes.
- Tokens and IDs that grant access: ≥ 128 bits from the platform's CSPRNG; reset tokens single-use with expiry ≤ 1 hour.
- No home-made encryption; use the platform library with authenticated modes.

### Errors and fail-closed behaviour (S14)

An exception in an authorization or validation path denies the request. Responses carry a generic message and a request ID; stack traces, SQL, file paths and versions go only to server logs.

### Secure defaults and configuration (S15)

Debug off in every non-local configuration; new feature flags default off; CORS lists explicit origins and never combines `*` with credentials; cookies `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`; security headers kept (`Content-Security-Policy` starting from `default-src 'self'`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`).

### Logging and sensitive data (S4, S18)

| Log | Never log |
|---|---|
| Request ID, actor ID (opaque), event name, outcome, counts, durations | Request bodies, headers, cookies, tokens, passwords, emails, names, card or bank data, full IP addresses tied to a user |

Security events to log with actor and time: authentication failures, authorization denials, exports of Financial or Personal data, permission changes, secret rotation. Proving test: trigger a failure with a synthetic email in the request and assert the captured log line contains the request ID and not the email.

### Integrity: downloads, CI, deserialization (S17, S20)

- No `curl … | sh`; downloaded tools carry a pinned version and a checked SHA-256 (see `../../agentic-sdlc/templates/ci/security.yml`).
- CI actions pinned by full commit SHA with the tag in a comment.
- No native deserialization (pickle, Java serialization, YAML with object tags) of data from outside the trust boundary; parse JSON into a validated schema.
- A diff that touches CI workflows, CODEOWNERS, permission files, AGENTS.md or `.agentic-sdlc/bin/` is accepted only when the plan's Files column lists that path.

### Dependencies (S16)

Exact pin or lockfile, lockfile committed in the same commit, the `plan.md` `## Dependencies` row, and `dep-audit` with 0 critical/high. Procedure and triage: `secrets-and-supply-chain.md`.

## 3. Review output format

For each item: `S8 PASS — src/export/params.ts:14 schema; test export_rejects_page_size_101` or `S10 FAIL — src/export/csv.ts:41 writes cell text unescaped` or `S11 n/a — no file or path handling in the diff`. Each FAIL becomes one PR Review triage row: Lens `L3`, Finding starting with `sec S10`, severity not below the item's floor, file:line, cause. Close with `L3 security: 20 items · <n> PASS · <n> FAIL · <n> n/a`.
