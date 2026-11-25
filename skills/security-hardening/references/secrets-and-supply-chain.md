# Secrets and Supply Chain

Load in Build before the first commit of a task that adds configuration, credentials or a dependency; before the PR opens (secret scan, `dep-audit`); and in Design when the plan adds a dependency. Contract and failure behaviour: `../../agentic-sdlc/references/security.md` §Secrets and §Dependencies; rule 10 in `../../agentic-sdlc/references/rules.md`. CI template: `../../agentic-sdlc/templates/ci/security.yml`.

## 1. Secrets

### Where secrets may live

| Allowed | Forbidden |
|---|---|
| Environment variables injected at runtime; the platform's secret manager; CI encrypted secrets | Source, tests, fixtures, snapshots, logs, prompts, commit messages, PR text, issue text, examples, `.env` committed to git, hard-coded fallback values (`process.env.KEY or "dev-key-123"`) |

Configuration fails fast when a required secret is missing (start-up error naming the variable, never its value). A committed `.env.example` holds names with empty or obviously fake values.

### .gitignore floor

```text
.env
.env.*
!.env.example
*.pem
*.key
id_rsa*
*.p12
```

Check: `git ls-files | grep -E '(^|/)\.env($|\.)|\.pem$|id_rsa'` prints nothing (an `.env.example` match is acceptable and reviewed by name).

### Scan before the PR (PR Verification row `secret-scan`)

| Order | Command | Pass |
|---|---|---|
| 1 | `gitleaks git --redact --log-opts="<base>..HEAD" .` (gitleaks ≥ 8.19; older: `gitleaks detect --redact`) | exit 0 |
| 2 | The project's own scanner (for example `trufflehog git file://. --since-commit <base> --only-verified`) | exit 0, no findings |
| 3 | Fallback grep from `security.md` §Secrets on `git diff <base>...HEAD` | 0 lines printed (grep exit 1) |

Record: `| secret-scan | — | \`gitleaks git --redact --log-opts="main..HEAD" .\` | 0 | <fingerprint> | <time> | Developer |`. Scanner output is pasted with `--redact` so no value reaches the PR. A staged check before each commit uses file names only: `git diff --staged --name-only -G'(password|secret|api[_-]?key|token|PRIVATE KEY)'` — any output means review the named files.

### A secret is found

1. Stop the task: status `BLOCKED`. Never print, quote or re-type the value; name file, line and rule only.
2. Report a Critical finding (`sec S1` or `sec S2`).
3. Notify the secret's owner. The owner revokes and rotates within 24 h.
4. Record rotation in an issue labelled `security`: date, owner role, where the new secret lives, scope of exposure (local only, pushed branch, public). Never the old or new value.
5. Reached a shared remote → SEV2 incident (`../../agentic-sdlc/references/release-ops.md` §Incidents). History rewriting may follow rotation; it never replaces it.
6. Remove the value from the working tree, re-run the scan, and continue only after exit 0 and the rotation record exists.

A secret pasted into an agent conversation counts as exposed to the model provider: rotate it the same way.

## 2. Dependencies

### The plan note (Design, before Build)

One row per new or upgraded direct dependency in `plan.md` `## Dependencies` (columns from `../../agentic-sdlc/templates/plan.md`). Fill each field with evidence, not opinion:

| Field | How to obtain it | Pass |
|---|---|---|
| Reason | Name the standard-library or existing-dependency alternative considered and why it falls short | One sentence with the gap |
| Exact version | Registry page or `npm view <pkg> version` / `pip index versions <pkg>` | Pinned `x.y.z` or locked |
| License | Registry metadata and the repository's LICENSE file | MIT, BSD-2/3-Clause, Apache-2.0, ISC, MPL-2.0; else Tech Lead decision in the note |
| Last release | Registry release date | ≤ 12 months before the note date |
| Advisories | `npm audit --audit-level=high`, `pip-audit`, `osv-scanner --lockfile=<lockfile>` | 0 critical/high; command and exit code pasted |
| Typosquat check | Compare the name with the upstream docs; the registry's repository link points to that project; first publish ≥ 30 days ago; list `preinstall`/`install`/`postinstall` scripts | All match; scripts listed |
| Lockfile | Lockfile diff in the same commit | yes |

No new dependency → `none — <reason>`. Removal needs no row.

### Audit commands by ecosystem

| Lockfile | Native audit | Cross-ecosystem |
|---|---|---|
| `package-lock.json` | `npm audit --audit-level=high` | `osv-scanner scan source --recursive .` |
| `pnpm-lock.yaml` | `pnpm audit --audit-level high` | same |
| `yarn.lock` (Yarn 2+) | `yarn npm audit --all --recursive --severity high` | same |
| `requirements*.txt`, `poetry.lock`, `uv.lock` | `pip-audit -r requirements.txt` | same |
| `go.sum` | `govulncheck ./...` | same |
| `Cargo.lock` | `cargo audit` | same |
| `Gemfile.lock` | `bundle audit check --update` | same |

When the native tool is absent, `osv-scanner` is the default; when neither runs, the PR row says `CANNOT_VERIFY — no scanner available` and the Security Auditor names who runs it and when. Never substitute an unofficial tool without naming it in the row.

### Triage of advisories

| Finding | Reachable at runtime? | Action |
|---|---|---|
| Critical or high | Yes, or unknown | Critical finding; PR is NO-GO until upgraded, replaced or removed (Critical takes no `accept-risk` or `defer`, `../../agentic-sdlc/references/governance.md` §6.1) |
| Critical or high | No (dev-only, build-only, code path never called — shown by evidence) | Still blocks the CI gate; a waiver with the reachability evidence is the only exit |
| Medium | Runtime | Important finding; fix in this change or a follow-up issue |
| Low, or medium dev-only | — | Minor; deferred list |

Never run a forced automatic fix (`npm audit fix --force`) inside a task: it changes major versions without a plan row. One dependency per upgrade commit; tests green before and after; read the changelog for majors.

### Install scripts and the lockfile diff

- Install with lifecycle scripts disabled first (`npm ci --ignore-scripts`, `pnpm install --frozen-lockfile --ignore-scripts`), read each script the new version adds, then allow only the named packages that need them.
- Review the lockfile diff, not only the manifest: a one-line manifest change that pulls 40 transitive packages is a finding to explain in the PR.
- Competing lockfiles (two package managers) → stop and ask the Tech Lead which one is authoritative.

### CI enforcement

Copy `../../agentic-sdlc/templates/ci/security.yml` to `.github/workflows/security.yml` and make both jobs required checks. It pins its action by commit SHA, verifies scanner checksums, fails `secret-scan` on any finding and `dependency-audit` on any advisory with CVSS ≥ 7.0. For other CI hosts, reproduce the two commands with the same pass rules; until a required check exists, the PR carries the local command output in its Verification rows.
