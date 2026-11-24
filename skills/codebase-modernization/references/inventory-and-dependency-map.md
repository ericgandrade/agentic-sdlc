# Inventory and dependency map

Load at Step 1 (portfolio scope). Output: `docs/modernization/inventory.md`. Owner: Analyst; the Architect reviews the dependency map before dispositions are proposed.

## 1. Inputs, in order of trust

| Source | Gives | Trust |
|---|---|---|
| Manifests and lockfiles (`package-lock.json`, `poetry.lock`, `go.sum`, `pom.xml`, `Gemfile.lock`, `*.csproj`) | Exact runtime, framework and package versions | High — read, never inferred |
| `docs/codemap.md` (verified ≤ 90 days) | Modules, `depends_on`, `ext:` dependencies, tests, deploy units | High if fresh; refresh first if stale |
| Coverage output of the project's test command at the base commit | Test safety per module | High — paste the summary line |
| Audit command output (`npm audit --json`, `pip-audit`, `osv-scanner`, `mvn dependency-check`) | Advisories with severity and ID | High — record command, date, counts |
| Vendor lifecycle pages | Support end dates | Medium — record URL and access date |
| `git log` / `git shortlog` | Churn, active people | High for counts, low for intent |
| Logs or metrics queries | Consumers, call volume, zero use | High — record query and window |
| Interviews, wiki pages | Ownership, criticality | Low — label `stated by <role>`, never scored above 2 without corroboration |

Skip generated, vendored and build-output directories (`node_modules/`, `vendor/`, `dist/`, `build/`, `*.min.js`, generated clients) — record them as `skipped: generated` so a later reader knows they were not read.

The inventory runs no build, no migration and no deployment. Commands are read-only (`git`, audit tools in report mode, coverage on the existing suite).

## 2. Commands

```bash
# Base commit for every number in the file
git rev-parse --short=12 HEAD

# Churn per file, last 12 months, excluding merge commits
git log --since=12.months --no-merges --name-only --format= | sort | uniq -c | sort -rn | head -20

# Churn per module (replace src/billing with each module path)
git log --since=12.months --no-merges --oneline -- src/billing | wc -l

# Same, excluding dependency bumps
git log --since=12.months --no-merges --oneline -- src/billing | grep -viE "bump|deps|dependabot|renovate" | wc -l

# Active people per module (≥ 1 commit in 12 months)
git shortlog -sn --since=12.months --no-merges -- src/billing

# Last human change
git log -1 --format="%h %ad %s" --date=short -- src/billing
```

Run coverage once for the whole suite and read per-module figures from the report; never estimate coverage from file names.

## 3. Dependency edge kinds

| Kind | How to find | Why it matters |
|---|---|---|
| code | `depends_on` in the code map; imports | Compile-time coupling; refactor order |
| runtime | HTTP clients and routes, RPC stubs, queue publish/subscribe, cron schedules, webhooks | Breaks at deploy time, invisible to the compiler |
| data | Tables, files or buckets read or written by ≥ 2 modules (`git grep -n "FROM orders\|INTO orders"`, ORM model usage) | Riskiest edges: a schema change breaks every reader; forces expand–contract |
| external | `ext:` packages and third-party services with version and support end date | Drives support and advisory risk |

A shared-data edge is flagged `⚠ shared` in the map and listed again under the Architect's design questions. Cycles (A → B → A) are listed explicitly; a migration cannot move one side of a cycle alone.

Hyrum's Law: every observable behaviour of a component with many consumers is depended on by someone — error messages, ordering, timing, rounding. For components with > 5 consumers record the observable outputs (formats, status codes, ordering) as candidate CHAR targets.

## 4. File format — `docs/modernization/inventory.md`

```markdown
# Modernization inventory

verified: 2026-11-24 @ 4f1c2a9b0d3e
scope: whole repository (14 modules from docs/codemap.md)
coverage of scan: deep 6 · skimmed 5 · skipped 3 (generated: clients/, vendor/, dist/)
audit: npm audit 2026-11-24 (2 high, 5 moderate) · pip-audit 2026-11-24 (1 critical)

## Components

| ID | Module | Runtime / framework (exact) | Datastore | Owner | Active people (12 mo) | Coverage | Commits 12 mo (feature) | Consumers (30 d) | Flags |
|---|---|---|---|---|---|---|---|---|---|
| C1 | billing | PHP 7.2.34 / Laravel 5.8 | MySQL 5.7 `invoices`, `payments` | team-billing | 1 | 0% | 38 | 3 | money, personal data |
| C2 | reports | Python 3.6.15 / Flask 1.1 | MySQL 5.7 read replica | none | 0 | 12% | 4 | 2 | — |

## Dependency map

| From | To | Kind | Evidence | Note |
|---|---|---|---|---|
| C2 reports | `invoices` table | data | `reports/queries.py:44 @ 4f1c2a9b0d3e` | ⚠ shared with C1 |
| C1 billing | ext:stripe-php 6.43 | external | `composer.lock:812 @ 4f1c2a9b0d3e` | support ends 2027-03 |

Cycles: none.

## Scores and dispositions
(filled at Steps 2–3 — see disposition-rubric.md §4)

## Roadmap
| Order | Component | Disposition | First slice | Path triggers | Work item |
|---|---|---|---|---|---|
```

Rules for the file:
- `verified: <date> @ <sha>` on line 3; older than 90 days → refresh before it is used for a decision (same cadence as the code map).
- Scan coverage line: `deep` (read entry points and data access), `skimmed` (manifest and tree only), `skipped` (with the reason). A module scored from a skim says so in its evidence cell.
- Every number cites its source: a `path:line @ sha`, a command with date, or a query with window.
- No secrets, hostnames of production systems, customer names or record contents. Consumer counts and call volumes are aggregates.

## 5. Refresh and reuse

| State of existing inventory | Action |
|---|---|
| Absent | Full build (this file) |
| Present, ≤ 90 days, no touched module changed (`git diff --name-only <sha>..HEAD -- <module paths>` empty) | Reuse; note `reused @ <sha>` in the work item |
| Present, ≤ 90 days, some modules changed | Focused refresh of changed modules; bump `verified` |
| Older than 90 days | Full refresh |

## 6. Existing steering documents

When the repository already keeps steering documents (product, tech, structure notes), read them as `stated by` sources: they describe intent, not current behaviour. Facts in them still need a citation into code before they are scored.
