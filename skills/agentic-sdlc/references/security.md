# Agentic SDLC — Security by Default

Load when filling `spec.md` §Security notes, when running review lens L3, and before adding or upgrading a dependency. Security sits on the default path: classification in Discover and Specify, secret and dependency rules in Build, the checklist lens in Test. Lead: Security Auditor (`agents/security-auditor.md`); it reports checks performed and findings, never "secure" or "compliant".

| Section | Mechanism | Trigger | Record |
|---|---|---|---|
| §Data classification | 11.1 input, risk triggers | Discover (path score); Specify | Score line; `spec.md` §Security notes |
| §Secrets | 11.3 | Every commit and PR, all paths | PR Verification row `secret-scan` |
| §Dependencies | 11.3, rule 10 | A new, upgraded or removed dependency | `plan.md` `## Dependencies` note; PR row `dep-audit` |
| §Review checklist | 11.2 | Lens L3: every Standard/Full PR; any Quick PR with a risk trigger | PR Review triage rows tagged `sec` |
| §Compliance | role model D3 | Risk trigger `regulated` | `spec.md` §Security notes obligations table; PR rows tagged `comp` |

## Data classification

**Trigger:** Discover scores the path; Specify writes §Security notes. Classify every data element the change reads, writes, stores, logs, exports or sends to a model.

| Class | Examples | Risk trigger | Handling rule |
|---|---|---|---|
| Public | Published docs, product catalogue | none | — |
| Internal | Order IDs, internal hostnames, feature names | none | Never in public artifacts or third-party prompts |
| Financial | Prices, order totals, payment amounts, revenue | `money` when amounts are created, changed or exported | Access-checked on the server; exports logged with actor ID |
| Personal | Names, emails, phone numbers, IP addresses, user IDs linked to a person | `personal/health data` | Synthetic data in fixtures; logs carry opaque IDs only; exports access-checked and logged |
| Sensitive personal | Health, biometric, government ID, bank or card data, precise location, children's data | `personal/health data` | Personal rules + threat model (`templates/threat-model.md`†) |
| Secret | Passwords, API keys, tokens, private keys, connection strings | none by itself | §Secrets; never in code, prompts, logs or fixtures |

† `templates/threat-model.md` is added in a later release; until then write one table with `Threat`, `STRIDE`, `Rating` and `Mitigation` columns (`agents/security-auditor.md`).

**Decision rule.** Personal or sensitive personal data in the change → the `personal/health data` trigger counts in the path score, which forces the path to **at least Standard**; `references/paths.md` §Score sets the final path. A data element with an unknown class is treated as Personal until classified.

**§Security notes content (Standard/Full; `spec-lint` requires the section):**

1. **Data classes:** each element with its class, and where it is stored, logged or exported.
2. **Authentication and authorization:** who can call each new entry point, and the server-side check that enforces it.
3. **Inputs:** each new external input with its validation (type, length, range or allowlist).
4. **Secrets:** each new secret, where it is stored (environment or secret manager) and who rotates it; or `none`.
5. **Threat model:** `specs/NNN-slug/threat-model.md` link on Full or risk-flagged items; otherwise `n/a — <reason>`.

**Failure behaviour.** Empty section on Standard/Full → `spec-lint` exit 1. Threat model: Full path without `threat-model.md` → TM01 error (exit 1); risk-flagged Standard spec without it → TM02 warning, written by the Security Auditor before Specify sign-off; a high or critical threat whose Mitigation cites no active `AC-n` → TM03 error (exit 1). Classification unknown after the 3-round question limit → Security Auditor `NEEDS_CONTEXT`; the path is scored with the `personal/health data` trigger.

## Secrets

**Trigger:** every commit in Build and every PR on every path. **Rules:**

1. No secret in code, tests, fixtures, snapshots, logs, prompts, commit messages, PR text or examples. Configuration reads secrets from the environment or a secret manager; no hard-coded fallback values.
2. `.env` and key files are git-ignored; `git ls-files | grep -E '(^|/)\.env($|\.)|\.pem$|id_rsa'` returns nothing.
3. Before the PR opens, the Developer runs the secret scan and records it as a PR Verification row `secret-scan`: `gitleaks git --redact` (gitleaks ≥ 8.19; `gitleaks detect --redact` before) or the project's scanner. Scanner absent → this fallback must print 0 lines (exit 1 from grep = clean):

   ```bash
   git diff <base>...HEAD | grep -nEi "AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9-]+|(api[_-]?key|secret|token|passw(or)?d)[\"' ]*[:=] *[\"'][^\"']{8,}"
   ```
4. Logs and error messages never echo request bodies, headers or values of the Personal or Secret classes.

**Failure behaviour.** Secret detected → stop (`BLOCKED`), report a Critical finding without repeating the value, and notify the secret's owner. The owner revokes and rotates it within 24 h; rotation evidence (date, owner, new secret location, never the value) goes into an issue labelled `security`. A secret that reached a shared remote is a SEV2 incident (`references/release-ops.md` §Incidents). Rewriting git history never replaces rotation.

## Dependencies

**Trigger:** Design (the plan adds a dependency) or Build (a lockfile change appears). **Artifact:** one row per dependency in `plan.md` `## Dependencies`, approved with the plan.

| Field | Rule |
|---|---|
| Name and exact version | Pinned exactly in the manifest (`1.4.2`, not `^1.4.2`) or by the lockfile; lockfile committed in the same commit |
| Reason | Why the standard library or an existing dependency does not cover it |
| License | MIT, BSD-2/3-Clause, Apache-2.0, ISC or MPL-2.0; anything else needs a Tech Lead decision written in the note |
| Last release | ≤ 12 months before the note date |
| Advisories | 0 known critical/high: `npm audit --audit-level=high`, `pip-audit`, or `osv-scanner --lockfile=<lockfile>`; command and exit code pasted |
| Typosquat check | Name compared with the upstream project's docs or repository URL; the registry's repository link matches; first published ≥ 30 days ago; install scripts (`preinstall`, `postinstall`) listed |

Scope: one row per new or upgraded direct dependency; no new dependency → the single line `none — <reason>`. Transitive-only lockfile changes need no row, but the advisory command runs on every PR whose lockfile changes and records a PR Verification row `dep-audit`. Removal needs no row.

**Failure behaviour.** Missing note → unattended run halts (`references/autonomous.md`); in review, an Important finding. A critical or high advisory → Critical finding; the PR stays NO-GO until upgraded, replaced or waived (`references/governance.md` §Waivers, expiry ≤ 30 days). A typosquat mismatch → Critical finding, dependency removed.

## Review checklist (lens L3)

**Trigger:** every Standard/Full PR and every Quick PR with a risk trigger; the Reviewer runs it with the Security Auditor (`references/review.md`). Each item is marked PASS (with file:line or command output), FAIL, or `n/a — <reason>`. Tags map items to OWASP Top 10:2025 (A01–A10) and OWASP Top 10 for LLM Applications 2025 (LLM01–LLM10).

| # | Check | Evidence | Severity if FAIL | Tag |
|---|---|---|---|---|
| S1 | Secret scan clean on the branch | `secret-scan` row, exit 0 | Critical | A04 |
| S2 | No hard-coded secret, default credential or committed `.env` | grep + `git ls-files` output | Critical | A02 |
| S3 | Fixtures, examples, logs and prompts hold synthetic data only | file list reviewed | Critical | LLM02 |
| S4 | New log lines carry IDs, never Personal or Secret values | log statements in the diff | Important | A09 |
| S5 | Every new entry point requires authentication; deny by default | test proving 401/redirect | Critical | A07 |
| S6 | Object-level authorization on the server; another user's ID is refused | test proving 403/404 | Critical | A01 |
| S7 | New service accounts, tokens and DB roles have the minimum grants | grant statements in the diff | Important | A01 |
| S8 | External input validated at the boundary (type, length, range, allowlist) | validator code + a rejecting test | Important | A05 |
| S9 | Queries and commands parameterized; no string-built SQL, shell or path | diff review | Critical | A05 |
| S10 | Output encoded for its sink (HTML, CSV formula prefixes `= + - @` tab CR, JSON, headers) | test with a hostile value | Important | A05 |
| S11 | File paths and uploads: no traversal, size and type limits | test or code reference | Important | A01 |
| S12 | Resource limits on new endpoints and jobs: row cap, page size, timeout, rate limit | limit value + test | Important | A10 |
| S13 | Standard crypto only; no MD5/SHA-1 for security; CSPRNG for tokens | diff review | Critical | A04 |
| S14 | Fail closed; errors reveal no stack trace, query or internal path | error-path test | Important | A10 |
| S15 | Secure defaults: debug off, no `*` CORS with credentials, new flags default off | config diff | Important | A02 |
| S16 | New dependencies carry the §Dependencies note; `dep-audit` 0 critical/high | note + output | Critical | A03 |
| S17 | No unverified downloads (`curl \| sh`), CI actions pinned by SHA, no deserialization of untrusted data | diff review | Important | A08 |
| S18 | Security events logged with actor and time: authorization denials, exports of Financial or Personal data | log line + test | Important | A09 |
| S19 | Untrusted text sent to a model is separated from instructions; model output validated before it reaches a sink or tool | code reference + hostile-input test | Critical | LLM01, LLM05, LLM06 |
| S20 | Diff touches CI workflows, CODEOWNERS, permission files, AGENTS.md or `.agentic-sdlc/bin/` only when the plan's `Files` list them (guards against injected instructions) | `git diff --stat` vs plan | Critical | LLM01, A08 |

**Output.** One PR Review triage row per FAIL, tagged `sec` with the item ID (`sec S10`), severity, file:line and cause; plus one summary line: `L3 security: 20 items · <n> PASS · <n> FAIL · <n> n/a`.

**Failure behaviour.** A required L3 not run, or a PASS without evidence → `lens not run`, counted as `CANNOT_VERIFY` → PR NO-GO. An open Critical `sec` finding blocks Test and Release sign-off; an Important one needs a fix or owner acceptance with a follow-up issue.

## Compliance

Trigger: the `regulated` risk trigger (`references/paths.md` §Score). The Security Auditor takes the compliance role; no separate agent.

1. **Specify.** List each obligation that applies: the regulation or contract clause, the requirement in one line, and the control that meets it. Record it in `spec.md` §Security notes as `| Obligation | Clause | Control | AC-n or task | Evidence |`. An obligation without a control → an open question deferred to the Product Owner, or a new AC.
2. **Design.** Each control becomes a plan task or an AC that names its test. The data retention, audit-log and access-review requirements are written as AC.
3. **Test.** For each row: check the evidence (a test ID, a log sample, a configuration diff). Record one PR Review triage row per gap, tagged `comp`. Gaps use the `sec` severity scale.
4. **Release.** The release notes' `## Residual risks` lists every obligation that has a waiver. Audit export: `references/standards-mapping.md`†.

The Security Auditor reports the obligations checked and the gaps it found. It never states that a change is "compliant"; that is the decision of the named compliance owner, recorded with the Release sign-off when the contract requires one.

## Sources

Secret-handling, dependency and review-checklist practices adapt Addy Osmani's agent-skills (MIT) security guidance and BMad Method's (MIT) OWASP-based review lists; categories follow the OWASP Top 10:2025 and the OWASP Top 10 for LLM Applications 2025. Text is original.
