Path: Quick · S=3 · R=0
# slugify keeps trailing dashes
Status: ready
Reported by: Product Owner (dogfood-owner, SIMULATED) · 2026-11-24

`slugify('Hello World!')` returns `"hello-world-"`. Slugs ending in `-` produce ugly URLs (`/posts/hello-world-`).
Expected `"hello-world"`.

> Drafted by an AI agent during triage; decisions are recorded by the named human.

## Intake record
Path: Quick · S=3 · R=0

| Field | Value |
|---|---|
| Source | request from Product Owner on 2026-11-24 |
| Problem | library users get slugs that end in `-` when the input ends in punctuation or whitespace — evidence: `node -e` reproduction prints `"hello-world-"` for `Hello World!` |
| Class | bug — documented behaviour (URL slug) violated by current output |
| Search | terms "slug", "dash", "trailing" · tracker n/a (no tracker) · docs/issues 0 · docs/out-of-scope 0 · specs/ 0 (absent) · code 1 (`src/slugify.js`) |
| Intake | n/a — no duplicate or prior rejection found (search: terms above) |
| Size | files 2 (`src/slugify.js`, `test/slugify.test.js`) → 1 · components 1 (strkit-lib) → 1 · iterations 1 → 1 · S=3 → Quick |
| Risk | auth no · personal/health data no · money no · public API no (return value of an existing function is fixed to its documented contract, signature unchanged) · schema no · irreversible no · regulated no · R=0 → Quick |
| Indicator | n/a — internal library bug fix |
| Priority | n/a — Product Manager not triggered; Product Owner orders the backlog |
| Bug verification | reproduced: `slugify('Hello World!')` → `"hello-world-"` at d0c78b1a9189 |
| Recurrence | none |
| Specialists | PM no · UX Designer no · Security Auditor no · Architect no |
| Readiness | ready — failing criteria none |
| Related | none |
| Next | Build (Quick, AC-1 below) |

**AC-1** Given the input `"Hello World!"`, when `slugify` is called, then it returns `"hello-world"` (no leading or trailing `-`).

## Comments
